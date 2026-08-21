import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
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

type BroadcastTarget = {
  broadcastId: string;
  patientId: string;
};

const sessionIdSchema = z.object({ sessionId: z.string().uuid() });
const HEARTBEAT_WINDOW_SECONDS = 35;

type SessionSnapshot = {
  sessionId: string;
  patientId: string;
  state: string;
  professionalPresent: boolean;
  patientPresent: boolean;
  lastActivityAt: Date;
  endedAt: Date | null;
  endReason: string | null;
  expiresAt: Date;
};

const tokenHash = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex');

async function expireStaleSessions(app: FastifyInstance) {
  await app.db.query(
    `WITH expired AS (
       UPDATE teleconsultation_sessions
          SET state='EXPIRED', ended_at=COALESCE(ended_at, now()), end_reason=COALESCE(end_reason, 'EXPIRED'), updated_at=now()
        WHERE ended_at IS NULL AND expires_at <= now()
        RETURNING id
     )
     INSERT INTO teleconsultation_events(session_id, type)
     SELECT id, 'session.expired' FROM expired`,
  );
  await app.db.query(`DELETE FROM teleconsultation_join_tokens WHERE expires_at <= now()`);
}

async function sessionSnapshot(app: FastifyInstance, sessionId: string): Promise<SessionSnapshot | null> {
  const result = await app.db.query<SessionSnapshot>(
    `SELECT id AS "sessionId", patient_id AS "patientId", state,
            professional_last_seen_at > now() - ($2 * interval '1 second') AS "professionalPresent",
            patient_last_seen_at > now() - ($2 * interval '1 second') AS "patientPresent",
            last_activity_at AS "lastActivityAt", ended_at AS "endedAt", end_reason AS "endReason",
            expires_at AS "expiresAt"
       FROM teleconsultation_sessions WHERE id=$1`,
    [sessionId, HEARTBEAT_WINDOW_SECONDS],
  );
  return result.rows[0] || null;
}

function canReadSession(auth: { role: 'ADMIN' | 'PATIENT'; patientId: string | null }, session: SessionSnapshot) {
  return auth.role === 'ADMIN' || (auth.role === 'PATIENT' && auth.patientId === session.patientId);
}

async function appendEvent(app: FastifyInstance, sessionId: string, type: string, payload: object = {}) {
  await app.db.query(
    `INSERT INTO teleconsultation_events(session_id, type, payload) VALUES($1,$2,$3::jsonb)`,
    [sessionId, type, JSON.stringify(payload)],
  );
}

async function resolveBroadcastTarget(app: FastifyInstance, id: string): Promise<BroadcastTarget | null> {
  const result = await app.db.query<BroadcastTarget>(
    `SELECT COALESCE(a.id, e.id) AS "broadcastId",
            COALESCE(a.patient_id, e.patient_id) AS "patientId"
       FROM clinical_encounters e
       FULL OUTER JOIN appointments a ON a.id = e.appointment_id
      WHERE a.id = $1 OR e.id = $1
      LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function videoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  app.post('/appointments/:id/access', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
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

    await expireStaleSessions(app);
    const roomKey = randomBytes(24).toString('base64url');
    const sessionResult = await app.db.query<{ sessionId: string; state: string; expiresAt: Date; roomRotated: boolean }>(
      `INSERT INTO teleconsultation_sessions(source_id, patient_id, room_key, state, expires_at)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(source_id) DO UPDATE SET
         room_key=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN EXCLUDED.room_key ELSE teleconsultation_sessions.room_key END,
         state=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN EXCLUDED.state ELSE teleconsultation_sessions.state END,
         professional_last_seen_at=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN NULL ELSE teleconsultation_sessions.professional_last_seen_at END,
         patient_last_seen_at=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN NULL ELSE teleconsultation_sessions.patient_last_seen_at END,
         last_activity_at=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN now() ELSE teleconsultation_sessions.last_activity_at END,
         ended_at=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN NULL ELSE teleconsultation_sessions.ended_at END,
         end_reason=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN NULL ELSE teleconsultation_sessions.end_reason END,
         expires_at=CASE WHEN teleconsultation_sessions.ended_at IS NOT NULL OR teleconsultation_sessions.expires_at<=now() THEN EXCLUDED.expires_at ELSE GREATEST(teleconsultation_sessions.expires_at,EXCLUDED.expires_at) END,
         updated_at=now()
       RETURNING id AS "sessionId", state, expires_at AS "expiresAt", room_key=$3 AS "roomRotated"`,
      [id, patientId, roomKey, request.auth!.role === 'ADMIN' ? 'WAITING_PATIENT' : 'WAITING_PROFESSIONAL', new Date(closes)],
    );
    const session = sessionResult.rows[0];
    if (!session) return reply.code(503).send({ error: 'Não foi possível preparar a teleconsulta.' });

    const joinToken = randomBytes(32).toString('base64url');
    const participantRole = request.auth!.role === 'ADMIN' ? 'PROFESSIONAL' : 'PATIENT';
    if (session.roomRotated) {
      await app.db.query('DELETE FROM teleconsultation_join_tokens WHERE session_id=$1', [session.sessionId]);
    }
    await app.db.query(
      `INSERT INTO teleconsultation_join_tokens(token_hash, session_id, actor_user_id, participant_role, expires_at)
       VALUES($1,$2,$3,$4,$5)`,
      [tokenHash(joinToken), session.sessionId, request.auth!.userId, participantRole, session.expiresAt],
    );
    await appendEvent(app, session.sessionId, 'access.granted', { participantRole });

    const roomUrl = `/videocall.html#sessionId=${encodeURIComponent(session.sessionId)}&joinToken=${encodeURIComponent(joinToken)}`;
    const provider = 'P2P_WEBRTC';

    await audit(app.db, 'VIDEO_ACCESS_GRANTED', 'appointment', {
      actorUserId: request.auth!.userId,
      entityId: id,
      metadata: { role: request.auth!.role, provider },
    });

    return {
      data: {
        sessionId: session.sessionId,
        joinToken,
        roomUrl,
        expiresAt: new Date(session.expiresAt).toISOString(),
        appointmentId: id,
        provider,
        state: session.state,
      },
    };
  });

  app.post('/sessions/:sessionId/join', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const { joinToken } = z.object({ joinToken: z.string().min(32).max(256) }).parse(request.body);
    await expireStaleSessions(app);
    const result = await app.db.query<{ participantRole: 'PROFESSIONAL' | 'PATIENT'; roomKey: string; state: string; expiresAt: Date }>(
      `UPDATE teleconsultation_join_tokens t
          SET redeemed_at=COALESCE(t.redeemed_at, now())
         FROM teleconsultation_sessions s
        WHERE t.token_hash=$1 AND t.session_id=$2 AND t.actor_user_id=$3
          AND t.expires_at > now() AND s.id=t.session_id AND s.ended_at IS NULL
        RETURNING t.participant_role AS "participantRole", s.room_key AS "roomKey",
                  s.state, s.expires_at AS "expiresAt"`,
      [tokenHash(joinToken), sessionId, request.auth!.userId],
    );
    const joined = result.rows[0];
    if (!joined) return reply.code(401).send({ error: 'Convite de teleconsulta inválido ou expirado.' });
    await appendEvent(app, sessionId, joined.participantRole === 'PROFESSIONAL' ? 'professional.joined' : 'patient.joined');
    const iceServers: Array<{ urls: string[]; username?: string; credential?: string }> = [
      { urls: (app.env.WEBRTC_STUN_URLS || 'stun:stun.l.google.com:19302').split(',').map(value => value.trim()).filter(Boolean) },
    ];
    if (app.env.WEBRTC_TURN_URL && app.env.WEBRTC_TURN_USERNAME && app.env.WEBRTC_TURN_CREDENTIAL) {
      iceServers.push({ urls: [app.env.WEBRTC_TURN_URL], username: app.env.WEBRTC_TURN_USERNAME, credential: app.env.WEBRTC_TURN_CREDENTIAL });
    }
    const signaling = app.env.WEBRTC_SIGNALING_HOST
      ? {
          mode: 'configured' as const,
          host: app.env.WEBRTC_SIGNALING_HOST,
          port: app.env.WEBRTC_SIGNALING_PORT || (app.env.WEBRTC_SIGNALING_SECURE === false ? 80 : 443),
          path: app.env.WEBRTC_SIGNALING_PATH || '/',
          secure: app.env.WEBRTC_SIGNALING_SECURE !== false,
        }
      : { mode: 'peerjs-cloud-fallback' as const };
    return { data: { sessionId, ...joined, expiresAt: new Date(joined.expiresAt).toISOString(), iceServers, signaling } };
  });

  app.get('/sessions/:sessionId', async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    await expireStaleSessions(app);
    const session = await sessionSnapshot(app, sessionId);
    if (!session || !canReadSession(request.auth!, session)) return reply.code(404).send({ error: 'Teleconsulta não encontrada.' });
    return { data: session };
  });

  app.post('/sessions/:sessionId/heartbeat', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const body = z.object({ state: z.enum(['READY', 'CONNECTING', 'CONNECTED', 'RECONNECTING']).optional() }).parse(request.body || {});
    await expireStaleSessions(app);
    const current = await sessionSnapshot(app, sessionId);
    if (!current || !canReadSession(request.auth!, current)) return reply.code(404).send({ error: 'Teleconsulta não encontrada.' });
    if (current.endedAt) return reply.code(409).send({ error: 'A teleconsulta já foi encerrada.', data: current });

    const allowedTransitions: Record<string, string[]> = {
      READY: ['READY', 'CONNECTING', 'CONNECTED'],
      CONNECTING: ['CONNECTING', 'CONNECTED', 'RECONNECTING'],
      CONNECTED: ['CONNECTED', 'RECONNECTING'],
      RECONNECTING: ['RECONNECTING', 'CONNECTED'],
    };
    if (body.state && !(allowedTransitions[current.state] || []).includes(body.state)) {
      return reply.code(409).send({ error: `Transição inválida de ${current.state} para ${body.state}.`, data: current });
    }

    const seenColumn = request.auth!.role === 'ADMIN' ? 'professional_last_seen_at' : 'patient_last_seen_at';
    await app.db.query(
      `UPDATE teleconsultation_sessions
          SET ${seenColumn}=now(), last_activity_at=now(), updated_at=now(),
              state=CASE
                WHEN $2::text IS NOT NULL THEN $2
                WHEN ($3::text='ADMIN' AND patient_last_seen_at > now() - interval '35 seconds')
                  OR ($3::text='PATIENT' AND professional_last_seen_at > now() - interval '35 seconds') THEN 'READY'
                WHEN $3::text = 'ADMIN' THEN 'WAITING_PATIENT'
                ELSE 'WAITING_PROFESSIONAL'
              END
        WHERE id=$1 AND ended_at IS NULL`,
      [sessionId, body.state || null, request.auth!.role],
    );
    await appendEvent(app, sessionId, 'presence.heartbeat', { participantRole: request.auth!.role === 'ADMIN' ? 'PROFESSIONAL' : 'PATIENT', state: body.state });
    return { data: await sessionSnapshot(app, sessionId) };
  });

  app.post('/sessions/:sessionId/end', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
    if (request.auth!.role !== 'ADMIN') return reply.code(403).send({ error: 'Apenas a nutricionista pode encerrar a teleconsulta.' });
    const { sessionId } = sessionIdSchema.parse(request.params);
    const { reason } = z.object({ reason: z.enum(['COMPLETED', 'CANCELLED', 'TECHNICAL_FAILURE', 'ABANDONED']).default('COMPLETED') }).parse(request.body || {});
    const result = await app.db.query<{ sessionId: string }>(
      `UPDATE teleconsultation_sessions SET state='ENDED', ended_at=COALESCE(ended_at,now()),
              end_reason=COALESCE(end_reason,$2), last_activity_at=now(), updated_at=now()
        WHERE id=$1 AND ended_at IS NULL RETURNING id AS "sessionId"`,
      [sessionId, reason],
    );
    const session = await sessionSnapshot(app, sessionId);
    if (!session) return reply.code(404).send({ error: 'Teleconsulta não encontrada.' });
    if (result.rows[0]) {
      await appendEvent(app, sessionId, 'session.ended', { reason });
      await app.db.query(`UPDATE patient_notifications n SET status='RESOLVED',resolved_at=now(),read_at=COALESCE(read_at,now())
        FROM teleconsultation_sessions s,clinical_encounters e
        WHERE s.id=$1 AND n.patient_id=s.patient_id AND n.status='ACTIVE'
          AND n.dedupe_key='teleconsultation:'||e.id
          AND (e.id=s.source_id OR e.appointment_id=s.source_id)`,[sessionId]);
      await audit(app.db, 'VIDEO_SESSION_ENDED', 'teleconsultation_session', { actorUserId: request.auth!.userId, entityId: sessionId, metadata: { reason } });
    }
    return { data: session };
  });

  app.get('/sessions/:sessionId/events', async (request, reply) => {
    const { sessionId } = sessionIdSchema.parse(request.params);
    const { after, limit } = z.object({ after: z.coerce.number().int().nonnegative().default(0), limit: z.coerce.number().int().min(1).max(100).default(50) }).parse(request.query);
    const session = await sessionSnapshot(app, sessionId);
    if (!session || !canReadSession(request.auth!, session)) return reply.code(404).send({ error: 'Teleconsulta não encontrada.' });
    const events = await app.db.query<{ sequence: string; type: string; payload: object; createdAt: Date }>(
      `SELECT sequence::text, type, payload, created_at AS "createdAt"
         FROM teleconsultation_events WHERE session_id=$1 AND sequence>$2 ORDER BY sequence ASC LIMIT $3`,
      [sessionId, after, limit],
    );
    return { data: { events: events.rows, nextCursor: events.rows.at(-1)?.sequence || String(after) } };
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

    const target = await resolveBroadcastTarget(app, id);
    if (!target) return reply.code(404).send({ error: 'Consulta não encontrada.' });

    await app.db.query(
      `INSERT INTO video_broadcasts(broadcast_id, patient_id, state, expires_at)
       VALUES($1, $2, $3::jsonb, now() + interval '4 hours')
       ON CONFLICT(broadcast_id) DO UPDATE SET
         patient_id=excluded.patient_id,
         state=excluded.state,
         updated_at=now(),
         expires_at=excluded.expires_at`,
      [target.broadcastId, target.patientId, JSON.stringify(broadcastState)],
    );
    await app.db.query(`DELETE FROM video_broadcasts WHERE expires_at <= now()`);

    return { message: 'Apresentação transmitida ao paciente com sucesso.', data: broadcastState };
  });

  // Obter o estado atual de apresentação ao vivo para o paciente/nutricionista
  app.get('/appointments/:id/broadcast', async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const target = await resolveBroadcastTarget(app, id);
    if (!target) return reply.code(404).send({ error: 'Consulta não encontrada.' });
    if (request.auth!.role === 'PATIENT' && target.patientId !== request.auth!.patientId) {
      return reply.code(404).send({ error: 'Consulta não encontrada.' });
    }

    const result = await app.db.query<{ state: BroadcastState }>(
      `SELECT state FROM video_broadcasts WHERE broadcast_id=$1 AND expires_at > now()`,
      [target.broadcastId],
    );
    const state = result.rows[0]?.state || null;

    return { data: state };
  });
}
