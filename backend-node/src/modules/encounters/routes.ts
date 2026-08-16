import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit } from '../../shared/audit.js';
import { ensureAppointmentCharge } from '../../shared/finance.js';
import { missingClinicalCore } from '../../shared/clinical-completeness.js';

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

  app.get('/checkins/pending', async () => {
    const result = await app.db.query(`SELECT c.id,c.patient_id AS "patientId",p.name AS "patientName",
      c.appointment_id AS "appointmentId",c.answers,c.submitted_at AS "submittedAt",
      a.appointment_date AS "appointmentDate",a.appointment_time AS "appointmentTime"
      FROM preconsult_checkins c JOIN patients p ON p.id=c.patient_id
      LEFT JOIN appointments a ON a.id=c.appointment_id
      WHERE c.status='PENDING_REVIEW'
      ORDER BY COALESCE(a.appointment_date,current_date),COALESCE(a.appointment_time,current_time),c.submitted_at DESC LIMIT 20`);
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
    const checkins=await app.db.query(`SELECT id,answers,status,submitted_at AS "submittedAt",reviewed_at AS "reviewedAt" FROM preconsult_checkins WHERE patient_id=$1 AND ($2::uuid IS NULL OR appointment_id=$2) ORDER BY submitted_at DESC LIMIT 5`,[result.rows[0].patientId,result.rows[0].appointmentId||null]);
    return { data: { ...result.rows[0], sections: Object.fromEntries(sections.rows.map(row => [row.sectionKey, { data: row.data, savedAt: row.savedAt }])), labs:labs.rows, supplements:supplements.rows,checkins:checkins.rows } };
  });

  app.patch('/:id/checkins/:checkinId/review',async(request,reply)=>{const{id,checkinId}=z.object({id:z.uuid(),checkinId:z.uuid()}).parse(request.params);const result=await app.db.query<{id:string}>(`UPDATE preconsult_checkins c SET status='REVIEWED',reviewed_at=now(),reviewed_by=$3 FROM clinical_encounters e WHERE c.id=$2 AND e.id=$1 AND c.patient_id=e.patient_id RETURNING c.id`,[id,checkinId,request.auth!.userId]);if(!result.rows[0])return reply.code(404).send({error:'Check-in não encontrado para este atendimento.'});await audit(app.db,'PRECONSULT_CHECKIN_REVIEWED','preconsult_checkin',{actorUserId:request.auth!.userId,entityId:checkinId,metadata:{encounterId:id}});return{data:{id:checkinId,status:'REVIEWED'}}});

  app.put('/:id/sections/:section', async (request, reply) => {
    const { id, section } = z.object({ id: z.uuid(), section: sectionKey }).parse(request.params);
    const body = z.object({ data: sectionData, expectedSavedAt:z.iso.datetime().nullable().optional() }).parse(request.body);
    const encounter = await app.db.query<{status:string}>('SELECT status FROM clinical_encounters WHERE id=$1', [id]);
    if (!encounter.rows[0]) return reply.code(404).send({ error: 'Atendimento não encontrado.' });
    if (encounter.rows[0].status !== 'IN_PROGRESS') return reply.code(409).send({ error: 'Atendimento finalizado não pode ser alterado.' });
    const saved=body.expectedSavedAt
      ?await app.db.query<{savedAt:Date}>(`UPDATE clinical_sections SET data=$3,saved_by=$4,saved_at=now() WHERE encounter_id=$1 AND section_key=$2 AND saved_at=$5::timestamptz RETURNING saved_at AS "savedAt"`,[id,section,body.data,request.auth!.userId,body.expectedSavedAt])
      :await app.db.query<{savedAt:Date}>(`INSERT INTO clinical_sections(encounter_id,section_key,data,saved_by) VALUES($1,$2,$3,$4) ON CONFLICT(encounter_id,section_key) DO NOTHING RETURNING saved_at AS "savedAt"`,[id,section,body.data,request.auth!.userId]);
    if(!saved.rows[0])return reply.code(409).send({error:'Esta etapa foi alterada em outra tela. Recarregue o atendimento antes de salvar novamente.'});
    await app.db.query('UPDATE clinical_encounters SET updated_at=now() WHERE id=$1', [id]);
    await audit(app.db, 'CLINICAL_SECTION_SAVED', 'clinical_encounter', { actorUserId: request.auth!.userId, entityId: id, metadata: { section } });
    return { data: { section, savedAt: saved.rows[0].savedAt } };
  });

  app.get('/:id/sections/:section/history',async(request,reply)=>{const{id,section}=z.object({id:z.uuid(),section:sectionKey}).parse(request.params);const encounter=await app.db.query('SELECT id FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});const result=await app.db.query(`SELECT v.id,v.version,v.data,v.saved_at AS "savedAt",u.email AS "savedBy" FROM clinical_section_versions v LEFT JOIN users u ON u.id=v.saved_by WHERE v.encounter_id=$1 AND v.section_key=$2 ORDER BY v.version DESC LIMIT 100`,[id,section]);await audit(app.db,'CLINICAL_SECTION_HISTORY_VIEWED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{section}});return{data:result.rows}});

  app.post('/:id/sections/:section/restore',async(request,reply)=>{const{id,section}=z.object({id:z.uuid(),section:sectionKey}).parse(request.params);const body=z.object({version:z.number().int().positive(),expectedSavedAt:z.iso.datetime()}).parse(request.body);const encounter=await app.db.query<{status:string}>('SELECT status FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});if(encounter.rows[0].status!=='IN_PROGRESS')return reply.code(409).send({error:'Atendimento finalizado não pode ser alterado.'});const restored=await app.db.query<{savedAt:Date}>(`UPDATE clinical_sections s SET data=v.data,saved_by=$4,saved_at=now() FROM clinical_section_versions v WHERE s.encounter_id=$1 AND s.section_key=$2 AND s.saved_at=$3::timestamptz AND v.clinical_section_id=s.id AND v.version=$5 RETURNING s.saved_at AS "savedAt"`,[id,section,body.expectedSavedAt,request.auth!.userId,body.version]);if(!restored.rows[0])return reply.code(409).send({error:'A versão não existe ou esta etapa foi alterada em outra tela.'});await app.db.query('UPDATE clinical_encounters SET updated_at=now() WHERE id=$1',[id]);await audit(app.db,'CLINICAL_SECTION_RESTORED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{section,version:body.version}});return{data:{section,version:body.version,savedAt:restored.rows[0].savedAt}}});

  app.put('/:id/labs',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const{items}=z.object({items:z.array(labSchema).max(100)}).parse(request.body);const encounter=await app.db.query<{patient_id:string;status:string}>('SELECT patient_id,status FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});if(encounter.rows[0].status!=='IN_PROGRESS')return reply.code(409).send({error:'Atendimento finalizado não pode ser alterado.'});const client=await app.db.connect();try{await client.query('BEGIN');await client.query('DELETE FROM laboratory_results WHERE encounter_id=$1',[id]);for(const item of items)await client.query(`INSERT INTO laboratory_results(encounter_id,patient_id,exam_date,marker,value,unit,reference_value,status,observation) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,encounter.rows[0].patient_id,item.examDate||null,item.marker,item.value,item.unit||null,item.referenceValue||null,item.status||null,item.observation||null]);await client.query(`INSERT INTO clinical_sections(encounter_id,section_key,data,saved_by) VALUES($1,'exams',$2,$3) ON CONFLICT(encounter_id,section_key) DO UPDATE SET data=excluded.data,saved_by=excluded.saved_by,saved_at=now()`,[id,{count:items.length},request.auth!.userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}await audit(app.db,'LAB_RESULTS_SAVED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{count:items.length}});return{data:{count:items.length}}});

  app.put('/:id/supplements',async(request,reply)=>{const{id}=z.object({id:z.uuid()}).parse(request.params);const{items}=z.object({items:z.array(supplementSchema).max(50)}).parse(request.body);const encounter=await app.db.query<{patient_id:string;status:string}>('SELECT patient_id,status FROM clinical_encounters WHERE id=$1',[id]);if(!encounter.rows[0])return reply.code(404).send({error:'Atendimento não encontrado.'});if(encounter.rows[0].status!=='IN_PROGRESS')return reply.code(409).send({error:'Atendimento finalizado não pode ser alterado.'});const client=await app.db.connect();try{await client.query('BEGIN');await client.query('DELETE FROM supplement_prescriptions WHERE encounter_id=$1',[id]);let position=0;for(const item of items){position++;await client.query(`INSERT INTO supplement_prescriptions(encounter_id,patient_id,name,dosage,posology,pharmaceutical_form,observation,position) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,encounter.rows[0].patient_id,item.name,item.dosage||null,item.posology||null,item.pharmaceuticalForm||null,item.observation||null,position])}await client.query(`INSERT INTO clinical_sections(encounter_id,section_key,data,saved_by) VALUES($1,'supplements',$2,$3) ON CONFLICT(encounter_id,section_key) DO UPDATE SET data=excluded.data,saved_by=excluded.saved_by,saved_at=now()`,[id,{count:items.length},request.auth!.userId]);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}await audit(app.db,'SUPPLEMENTS_SAVED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{count:items.length}});return{data:{count:items.length}}});

  app.post('/:id/finalize', async (request, reply) => {
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const saved = await app.db.query<{section_key:string}>('SELECT section_key FROM clinical_sections WHERE encounter_id=$1', [id]);
    const missing=missingClinicalCore(saved.rows.map(row=>row.section_key));
    if(missing.length)return reply.code(400).send({error:`Complete o registro clínico antes de finalizar: ${missing.join(', ')}.`});
    let financeCreated = false;
    const client=await app.db.connect();try{await client.query('BEGIN');const result=await client.query<{appointment_id:string|null}>(`UPDATE clinical_encounters SET status='COMPLETED', completed_at=now(), updated_at=now() WHERE id=$1 AND status='IN_PROGRESS' RETURNING appointment_id`,[id]);if(!result.rows[0]){await client.query('ROLLBACK');return reply.code(409).send({error:'Atendimento não encontrado ou já finalizado.'})}if(result.rows[0].appointment_id){await client.query("UPDATE appointments SET status='COMPLETED',updated_at=now() WHERE id=$1",[result.rows[0].appointment_id]);const finance=await ensureAppointmentCharge(client,result.rows[0].appointment_id,request.auth!.userId);financeCreated=finance.created}await audit(client,'ENCOUNTER_COMPLETED','clinical_encounter',{actorUserId:request.auth!.userId,entityId:id,metadata:{financeCreated}});await client.query('COMMIT')}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    return { data: { id, status: 'COMPLETED', financeCreated } };
  });
}
