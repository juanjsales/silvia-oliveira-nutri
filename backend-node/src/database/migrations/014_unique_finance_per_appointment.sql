CREATE UNIQUE INDEX IF NOT EXISTS financial_transactions_appointment_unique
  ON financial_transactions(appointment_id)
  WHERE appointment_id IS NOT NULL;
