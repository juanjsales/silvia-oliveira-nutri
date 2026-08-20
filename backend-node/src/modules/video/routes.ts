import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

type Appointment = {
  patientId: string;
  patientName: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  videoRoomToken: string;
};

type LaminaData = {
  id: string;
  title: string;
  summary: string;
  tips: string[];
  categoryLabel: string;
  icon?: string | undefined;
};

type BroadcastState = {
  activeTab: 'medidas' | 'fome' | 'prato' | 'bristol' | 'metas' | 'avaliacao' | 'conduta' | 'lamina';
  customTitle?: string | undefined;
  customNote?: string | undefined;
  laminaData?: LaminaData | undefined;
  clinicalData?: {
    weight?: string | undefined;
    height?: string | undefined;
    bmi?: string | undefined;
    bodyFat?: string | undefined;
    goals?: string | undefined;
    guidance?: string | undefined;
    dietRating?: string | undefined;
  } | undefined;
  updatedAt: string;
};

const liveBroadcasts = new Map<string, BroadcastState>();

export async function videoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.post('/appointments/:id/access', async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    let patientId = '';
    let patientName = '';
    let status = '';
    let encounterStatus: string | null = null;
    let startsAt: Date = new Date();
    let endsAt: Date = new Date(Date.now() + 60 * 60_000);
    let videoRoomToken = '';

    // 1. Tentar encontrar por agendamento
    const rAppt = await app.db.query<{
      patientId: string;
      patientName: string;
      status: string;
      encounterStatus: string | null;
      startsAt: Date;
      endsAt: Date;
      videoRoomToken: string;
    }>(
      `SELECT a.patient_id AS "patientId", p.name AS "patientName", a.status, e.status AS "encounterStatus",
        (a.appointment_date+a.appointment_time) AT TIME ZONE 'America/Sao_Paulo' AS "startsAt",
        ((a.appointment_date+a.appointment_time)+(a.duration_minutes||' minutes')::interval) AT TIME ZONE 'America/Sao_Paulo' AS "endsAt",
        a.video_room_token AS "videoRoomToken"
       FROM appointments a
       JOIN patients p ON p.id=a.patient_id
       LEFT JOIN clinical_encounters e ON e.appointment_id=a.id
       WHERE a.id=$1`,
      [id],
    );

    if (rAppt.rows[0]) {
      const a = rAppt.rows[0];
      patientId = a.patientId;
      patientName = a.patientName;
      status = a.status;
      encounterStatus = a.encounterStatus;
      startsAt = a.startsAt;
      endsAt = a.endsAt;
      videoRoomToken = a.videoRoomToken;
    } else {
      // 2. Se não encontrou por agendamento, tentar encontrar por atendimento clínico direto (sem agendamento prévio)
      const rEnc = await app.db.query<{
        patientId: string;
        patientName: string;
        status: string;
        startsAt: Date;
        videoRoomToken: string | null;
      }>(
        `SELECT e.patient_id AS "patientId", p.name AS "patientName", e.status, e.started_at AS "startsAt",
          COALESCE(e.video_room_token, encode(gen_random_bytes(18), 'hex')) AS "videoRoomToken"
         FROM clinical_encounters e
         JOIN patients p ON p.id=e.patient_id
         WHERE e.id=$1`,
        [id],
      );

      if (!rEnc.rows[0]) {
        return reply.code(404).send({ error: 'Consulta não encontrada.' });
      }

      const e = rEnc.rows[0];
      patientId = e.patientId;
      patientName = e.patientName;
      status = e.status;
      encounterStatus = e.status;
      startsAt = e.startsAt;
      endsAt = new Date(new Date(e.startsAt).getTime() + 120 * 60_000);
      videoRoomToken = e.videoRoomToken || id;
    }

    if (request.auth!.role === 'PATIENT' && patientId !== request.auth!.patientId) {
      return reply.code(404).send({ error: 'Consulta não encontrada.' });
    }

    if (encounterStatus === 'COMPLETED' || status === 'COMPLETED') {
      return reply.code(409).send({ error: 'Esta consulta já foi finalizada pela nutricionista.' });
    }

    if (['CANCELLED', 'ABSENT'].includes(status)) {
      return reply.code(409).send({ error: 'Esta consulta foi cancelada.' });
    }

    // Regra Rígida de Teleconsulta:
    // O paciente (PATIENT) SÓ pode entrar na sala de vídeo se a nutricionista estiver com o atendimento ATIVO (clinical_encounters status = 'IN_PROGRESS').
    // Se o atendimento não foi aberto pela nutricionista, o paciente é bloqueado e direcionado para a Sala de Espera Virtual.
    if (request.auth!.role === 'PATIENT' && encounterStatus !== 'IN_PROGRESS') {
      return reply.code(403).send({ error: 'Aguarde a nutricionista iniciar o atendimento. A sala será liberada em seguida.' });
    }

    const opens = new Date(startsAt).getTime() - 30 * 60_000;
    const closes = new Date(endsAt).getTime() + 30 * 60_000;

    if (request.auth!.role === 'PATIENT' && (Date.now() < opens || Date.now() > closes)) {
      return reply
        .code(403)
        .send({ error: 'A sala estará disponível 30 minutos antes da consulta e será encerrada 30 minutos depois.' });
    }

    const room = `nutri-${videoRoomToken}`;
    const moderator = request.auth!.role === 'ADMIN';
    const userName = moderator ? 'Dra. Silvia Oliveira Lemos' : patientName;
    const role = moderator ? 'moderator' : 'participant';
    const roomUrl = `/videocall.html?room=${encodeURIComponent(room)}&name=${encodeURIComponent(userName)}&role=${role}&minimal=true&embedded=true&v=4.0`;
    const provider = 'P2P_WEBRTC';

    await audit(app.db, 'VIDEO_ACCESS_GRANTED', 'appointment', {
      actorUserId: request.auth!.userId,
      entityId: id,
      metadata: { role: request.auth!.role, provider },
    });

    return { data: { roomUrl, expiresAt: new Date(closes).toISOString(), appointmentId: id, provider } };
  });

  // Salvar o estado de apresentação ao vivo (controlado pela nutricionista)
  app.post('/appointments/:id/broadcast', async (request, reply) => {
    if (request.auth!.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Apenas a nutricionista pode comandar a apresentação do paciente.' });
    }
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        activeTab: z.enum(['medidas', 'fome', 'prato', 'bristol', 'metas', 'avaliacao', 'conduta', 'lamina']),
        customTitle: z.string().max(200).optional(),
        customNote: z.string().max(1000).optional(),
        laminaData: z
          .object({
            id: z.string(),
            title: z.string(),
            summary: z.string(),
            tips: z.array(z.string()),
            categoryLabel: z.string(),
            icon: z.string().optional(),
          })
          .optional(),
        clinicalData: z
          .object({
            weight: z.string().optional(),
            height: z.string().optional(),
            bmi: z.string().optional(),
            bodyFat: z.string().optional(),
            goals: z.string().optional(),
            guidance: z.string().optional(),
            dietRating: z.string().optional(),
          })
          .optional(),
      })
      .parse(request.body);

    const broadcastState: BroadcastState = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Armazena com o ID passado
    liveBroadcasts.set(id, broadcastState);

    // Também sincroniza com o ID cruzado (se passou appointmentId, salva no encounterId e vice-versa)
    try {
      const crossRes = await app.db.query<{ appointmentId: string | null; encounterId: string | null }>(
        `SELECT a.id AS "appointmentId", e.id AS "encounterId"
         FROM clinical_encounters e
         FULL OUTER JOIN appointments a ON a.id = e.appointment_id
         WHERE a.id = $1 OR e.id = $1
         LIMIT 1`,
        [id],
      );
      if (crossRes.rows[0]) {
        const { appointmentId, encounterId } = crossRes.rows[0];
        if (appointmentId && appointmentId !== id) liveBroadcasts.set(appointmentId, broadcastState);
        if (encounterId && encounterId !== id) liveBroadcasts.set(encounterId, broadcastState);
      }
    } catch {
      // Ignora erro de resolução cruzada
    }

    return { message: 'Apresentação transmitida ao paciente com sucesso.', data: broadcastState };
  });

  // Obter o estado atual de apresentação ao vivo para o paciente/nutricionista
  app.get('/appointments/:id/broadcast', async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    let state = liveBroadcasts.get(id) || null;

    if (!state) {
      try {
        const crossRes = await app.db.query<{ appointmentId: string | null; encounterId: string | null }>(
          `SELECT a.id AS "appointmentId", e.id AS "encounterId"
           FROM clinical_encounters e
           FULL OUTER JOIN appointments a ON a.id = e.appointment_id
           WHERE a.id = $1 OR e.id = $1
           LIMIT 1`,
          [id],
        );
        if (crossRes.rows[0]) {
          const { appointmentId, encounterId } = crossRes.rows[0];
          if (appointmentId && liveBroadcasts.has(appointmentId)) state = liveBroadcasts.get(appointmentId)!;
          else if (encounterId && liveBroadcasts.has(encounterId)) state = liveBroadcasts.get(encounterId)!;
        }
      } catch {
        // Ignora
      }
    }

    return { data: state };
  });
}

