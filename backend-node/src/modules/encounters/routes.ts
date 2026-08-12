import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';

const sectionKey = z.enum(['context','anamnesis','recall24h','followup','assessment','exams','conduct','plan','supplements','notes']);
const clinicalValue:z.ZodType<unknown>=z.lazy(()=>z.union([z.string().max(10000),z.number(),z.boolean(),z.null(),z.array(clinicalValue).max(100),z.record(z.string().max(80),clinicalValue)]));
const sectionData = z.record(z.string().max(80), clinicalValue);
const labSchema=z.object({examDate:z.iso.date().optional(),marker:z.string().trim().min(1).max(160),value:z.string().trim().min(1).max(100),unit:z.string().trim().max(50).optional(),referenceValue:z.string().trim().max(160).optional(),status:z.string().trim().max(50).optional(),observation:z.string().trim().max(1000).optional()});
const supplementSchema=z.object({name:z.string().trim().min(1).max(200),dosage:z.string().trim().max(100).optional(),posology:z.string().trim().max(500).optional(),pharmaceuticalForm:z.string().trim().max(100).optional(),observation:z.string().trim().max(1000).optional()});

export async function encounterRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/', async request => {
    const { patientId } = z.object({ patientId: z.uuid().optional() }).parse(request.query);
    const result = await app.db.query(`SELECT e.id, e.patient_id AS "patientId", p.name AS "patientName",
      e.appointment_id AS "appointmentId", e.status, e.started_at AS "startedAt", e.completed_at AS "completedAt"
      FROM clinical_encounters e JOIN patients p ON p.id=e.patient_id
      WHERE ($1::uuid IS NULL OR e.patient_id=$1) ORDER BY e.started_at DESC LIMIT 50`, [patientId ?? null]);
    return { data: result.rows };
  });

  app.get('/patient/:patientId/history', async (request, reply) => {
    const { patientId } = z.object({ patientId: z.uuid() }).parse(request.params);
    const patient = await app.db.query('SELECT id FROM patients WHERE id=$1', [patientId]);
    if (!patient.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado.' });
    const encounters = await app.db.query(`SELECT e.id,e.status,e.started_at AS "startedAt",e.completed_at AS "completedAt",
      COALESCE(jsonb_object_agg(s.section_key,s.data) FILTER (WHERE s.section_key IS NOT NULL),'{}'::jsonb) AS sections
      FROM clinical_encounters e LEFT JOIN clinical_sections s ON s.encounter_id=e.id
      WHERE e.patient_id=$1 GROUP BY e.id ORDER BY e.started_at DESC`, [patientId]);
    const labs = await app.db.query(`SELECT l.id,l.encounter_id AS "encounterId",l.exam_date AS "examDate",l.marker,l.value,l.unit,
      l.reference_value AS "referenceValue",l.status,l.observation FROM laboratory_results l
      WHERE l.patient_id=$1 ORDER BY l.exam_date DESC NULLS LAST,l.created_at DESC`, [patientId]);
    await audit(app.db, 'PATIENT_HISTORY_VIEWED', 'patient', { actorUserId: request.auth!.userId, entityId: patientId });
    return { data: { encounters: encounters.rows, labs: labs.rows } };
  });

  app.post('/', async (request, reply) => {
    const body = z.object({ patientId: z.uuid(), appointmentId: z.uuid().optional() }).parse(request.body);
    const patient = await app.db.query('SELECT id FROM patients WHERE id=$1 AND active=true', [body.patientId]);
    if (!patient.rows[0]) return reply.code(404).send({ error: 'Paciente não encontrado ou inativo.' });
    if (body.appointmentId) {
      const appointment = await app.db.query('SELECT id FROM appointments WHERE id=$1 AND patient_id=$2', [body.appointmentId, body.patientId]);
      if (!appointment.rows[0]) return reply.code(400).send({ error: 'Consulta não pertence ao paciente informado.' });
      const existing = await app.db.query<{id:string}>('SELECT id FROM clinical_encounters WHERE appointment_id=$1', [body.appointmentId]);
      if (existing.rows[0]) return reply.send({ data: { id: existing.rows[0].id, resumed: true } });
    }
    const result = await app.db.query<{id:string}>(`INSERT INTO clinical_encounters(patient_id, appointment_id, opened_by)
      VALUES ($1,$2,$3) RETURNING id`, [body.patientId, body.appointmentId ?? null, request.auth!.userId]);
    const id = result.rows[0]!.id;
    if (body.appointmentId) await app.db.query("UPDATE appointments SET status='IN_PROGRESS', updated_at=now() WHERE id=$1", [body.appointmentId]);
    await audit(app.db, 'ENCOUNTER_STARTED', 'clinical_encounter', { actorUserId: request.auth!.userId, entityId: id, metadata: { patientId: body.patientId } });
    return reply.code(201).send({ data: { id, resumed: false } });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const result = await app.db.query(`SELECT e.id, e.patient_id AS "patientId", p.name AS "patientName", p.birth_date AS "birthDate",
      p.objective, p.whatsapp, p.email, e.appointment_id AS "appointmentId", COALESCE(a.video_room_token,e.video_room_token) AS "videoRoomToken", e.status,
      e.started_at AS "startedAt", e.completed_at AS "completedAt"
      FROM clinical_encounters e JOIN patients p ON p.id=e.patient_id LEFT JOIN appointments a ON a.id=e.appointment_id WHERE e.id=$1`, [id]);
    if (!result.rows[0]) return reply.code(404).send({ error: 'Atendimento não encontrado.' });
    const sections = await app.db.query<{sectionKey:string;data:unknown;savedAt:Date}>(`SELECT section_key AS "sectionKey", data, saved_at AS "savedAt"
      FROM clinical_sections WHERE encounter_id=$1`, [id]);
    const labs=await app.db.query(`SELECT id,exam_date AS "examDate",marker,value,unit,reference_value AS "referenceValue",status,observation FROM laboratory_results WHERE encounter_id=$1 ORDER BY exam_date DESC NULLS LAST,created_at`,[id]);
    const supplements=await app.db.query(`SELECT id,name,dosage,posology,pharmaceutical_form AS "pharmaceuticalForm",observation FROM supplement_prescriptions WHERE encounter_id=$1 ORDER BY position,created_at`,[id]);
    return { data: { ...result.rows[0], sections: Object.fromEntries(sections.rows.map(row => [row.sectionKey, { data: row.data, savedAt: row.savedAt }])), labs:labs.rows, supplements:supplements.rows } };
  });

  app.put('/:id/sections/:section', async (request, reply) => {
    const { id, section } = z.object({ id: z.uuid(), section: sectionKey }).parse(request.params);
    const body = z.object({ data: sectionData }).parse(request.body);
    const encounter = await app.db.query<{status:string}>('SELECT status FROM clinical_encounters WHERE id=$1', [id]);
    if (!encounter.rows[0]) return reply.code(404).send({ error: 'Atendimento não encontrado.' });
    if (encounter.rows[0].status !== 'IN_PROGRESS') return reply.code(409).send({ error: 'Atendimento finalizado não pode ser alterado.' });
    await app.db.query(`INSERT INTO clinical_sections(encounter_id, section_key, data, saved_by) VALUES ($1,$2,$3,$4)
      ON CONFLICT(encounter_id, section_key) DO UPDATE SET data=excluded.data, saved_by=excluded.saved_by, saved_at=now()`,
      [id, section, body.data, request.auth!.userId]);
    await app.db.query('UPDATE clinical_encounters SET updated_at=now() WHERE id=$1', [id]);
    await audit(app.db, 'CLINICAL_SECTION_SAVED', 'clinical_encounter', { actorUserId: request.auth!.userId, entityId: id, metadata: { section } });
    return { data: { section, savedAt: new Date().toISOString() } };
  });

  app.put('/:id/labs',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const{items}=z.object({items:z.array(labSchema).max(100)}).parse(request.body);const encounter=await app.db.query<{patient_id:string;status:string}>('SELECT patient_id,status FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});if(encounter.rows[0].status!=='IN_PROGRESS')return reply.code(409).send({error:'Atendimento finalizado não pode ser alterado.'});const client=await app.db.connect();try{await client.query('BEGIN');await client.query('DELETE FROM laboratory_results WHERE encounter_id=$1',[id]);for(const item of items)await client.query(`INSERT INTO laboratory_results(encounter_id,patient_id,exam_date,marker,value,unit,reference_value,status,observation) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,encounter.rows[0].patient_id,item.examDate||null,item.marker,item.value,item.unit||null,item.referenceValue||null,item.status||null,item.observation||null]);await client.query(`INSERT INTO clinical_sections(encounter_id,section_key,data,saved_by) VALUES($1,'exams',$2,$3) ON CONFLICT(encounter_id,section_key) DO UPDATE SET data=excluded.data,saved_by=excluded.saved_by,saved_at=now()`,[id,{count:items.length},request.auth!.userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}await audit(app.db,'LAB_RESULTS_SAVED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{count:items.length}});return{data:{count:items.length}}});

  app.put('/:id/supplements',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const{items}=z.object({items:z.array(supplementSchema).max(50)}).parse(request.body);const encounter=await app.db.query<{patient_id:string;status:string}>('SELECT patient_id,status FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});if(encounter.rows[0].status!=='IN_PROGRESS')return reply.code(409).send({error:'Atendimento finalizado não pode ser alterado.'});const client=await app.db.connect();try{await client.query('BEGIN');await client.query('DELETE FROM supplement_prescriptions WHERE encounter_id=$1',[id]);let position=0;for(const item of items){position++;await client.query(`INSERT INTO supplement_prescriptions(encounter_id,patient_id,name,dosage,posology,pharmaceutical_form,observation,position) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,encounter.rows[0].patient_id,item.name,item.dosage||null,item.posology||null,item.pharmaceuticalForm||null,item.observation||null,position])}await client.query(`INSERT INTO clinical_sections(encounter_id,section_key,data,saved_by) VALUES($1,'supplements',$2,$3) ON CONFLICT(encounter_id,section_key) DO UPDATE SET data=excluded.data,saved_by=excluded.saved_by,saved_at=now()`,[id,{count:items.length},request.auth!.userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}await audit(app.db,'SUPPLEMENTS_SAVED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{count:items.length}});return{data:{count:items.length}}});

  app.post('/:id/finalize', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const saved = await app.db.query<{ count: string }>('SELECT count(*)::text AS count FROM clinical_sections WHERE encounter_id=$1', [id]);
    if (Number(saved.rows[0]?.count ?? 0) < 2) {
      return reply.code(400).send({ error: 'Salve ao menos duas etapas antes de finalizar o atendimento.' });
    }
    const result = await app.db.query<{appointment_id:string|null}>(`UPDATE clinical_encounters SET status='COMPLETED', completed_at=now(), updated_at=now()
      WHERE id=$1 AND status='IN_PROGRESS' RETURNING appointment_id`, [id]);
    if (!result.rows[0]) return reply.code(409).send({ error: 'Atendimento não encontrado ou já finalizado.' });
    if (result.rows[0].appointment_id) await app.db.query("UPDATE appointments SET status='COMPLETED', updated_at=now() WHERE id=$1", [result.rows[0].appointment_id]);
    await audit(app.db, 'ENCOUNTER_COMPLETED', 'clinical_encounter', { actorUserId: request.auth!.userId, entityId: id });
    return { data: { id, status: 'COMPLETED' } };
  });
}
