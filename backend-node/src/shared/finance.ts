import type { Pool, PoolClient } from 'pg';

type Queryable = Pick<Pool | PoolClient, 'query'>;

export async function ensureAppointmentCharge(db: Queryable, appointmentId: string, createdBy: string) {
  const result = await db.query<{ id: string }>(`INSERT INTO financial_transactions
    (patient_id, appointment_id, description, amount, due_date, status, notes, created_by)
    SELECT patient_id, id, 'Consulta nutricional — ' || appointment_type, COALESCE(price, 0), appointment_date,
      'PENDING', CASE WHEN price IS NULL THEN 'Valor não informado no agendamento; revise antes de confirmar o pagamento.' ELSE 'Lançamento automático após conclusão da consulta.' END, $2
    FROM appointments WHERE id=$1
    ON CONFLICT (appointment_id) WHERE appointment_id IS NOT NULL DO NOTHING
    RETURNING id`, [appointmentId, createdBy]);
  return { created: Boolean(result.rows[0]), transactionId: result.rows[0]?.id ?? null };
}
