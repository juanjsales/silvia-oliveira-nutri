import type { Pool, PoolClient } from 'pg';

type Queryable = Pick<Pool | PoolClient, 'query'>;

export async function ensureAppointmentCharge(db: Queryable, appointmentId: string, createdBy: string) {
  const result = await db.query<{ id: string; inserted: boolean }>(`INSERT INTO financial_transactions
    (patient_id, appointment_id, description, amount, due_date, status, notes, created_by)
    SELECT patient_id, id, 'Consulta nutricional — ' || appointment_type, COALESCE(price, 0), appointment_date,
      'PENDING', CASE WHEN price IS NULL THEN 'Valor não informado no agendamento; revise antes de confirmar o pagamento.' ELSE 'Lançamento automático após conclusão da consulta.' END, $2
    FROM appointments WHERE id=$1
    ON CONFLICT (appointment_id) WHERE appointment_id IS NOT NULL DO UPDATE SET
      patient_id=CASE WHEN financial_transactions.status IN('PAID','REFUNDED') THEN financial_transactions.patient_id ELSE EXCLUDED.patient_id END,
      description=CASE WHEN financial_transactions.status IN('PAID','REFUNDED') THEN financial_transactions.description ELSE EXCLUDED.description END,
      amount=CASE WHEN financial_transactions.status IN('PAID','REFUNDED') THEN financial_transactions.amount ELSE EXCLUDED.amount END,
      due_date=CASE WHEN financial_transactions.status IN('PAID','REFUNDED') THEN financial_transactions.due_date ELSE EXCLUDED.due_date END,
      status=CASE WHEN financial_transactions.status='CANCELLED' THEN 'PENDING' ELSE financial_transactions.status END,
      notes=CASE WHEN financial_transactions.status IN('PAID','REFUNDED') THEN financial_transactions.notes ELSE EXCLUDED.notes END,
      updated_at=now()
    RETURNING id,(xmax=0) AS inserted`, [appointmentId, createdBy]);
  return { created: Boolean(result.rows[0]?.inserted), transactionId: result.rows[0]?.id ?? null };
}

export async function cancelAppointmentCharge(db: Queryable, appointmentId: string) {
  const result = await db.query<{ id: string }>(`UPDATE financial_transactions
    SET status='CANCELLED',paid_at=NULL,updated_at=now(),
      notes=concat_ws(' ',NULLIF(notes,''),'Cancelado automaticamente após cancelamento da consulta.')
    WHERE appointment_id=$1 AND status IN('PENDING','OVERDUE') RETURNING id`,[appointmentId]);
  return { cancelled:Boolean(result.rows[0]), transactionId:result.rows[0]?.id??null };
}

export async function syncOpenAppointmentCharge(db: Queryable, appointmentId: string) {
  const result=await db.query<{id:string}>(`UPDATE financial_transactions f SET
    patient_id=a.patient_id,description='Consulta nutricional — '||a.appointment_type,
    amount=COALESCE(a.price,0),due_date=a.appointment_date,updated_at=now()
    FROM appointments a WHERE a.id=$1 AND f.appointment_id=a.id AND f.status IN('PENDING','OVERDUE')
    RETURNING f.id`,[appointmentId]);
  return {synced:Boolean(result.rows[0]),transactionId:result.rows[0]?.id??null};
}
