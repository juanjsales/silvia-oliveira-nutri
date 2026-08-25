-- Estornos financeiros e justificativas formais de correção clínica.
ALTER TABLE financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_status_check;

ALTER TABLE financial_transactions
  ADD CONSTRAINT financial_transactions_status_check
  CHECK (status IN ('PENDING','PAID','CANCELLED','OVERDUE','REFUNDED'));

ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refunded_by uuid REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_refund_consistency;

ALTER TABLE financial_transactions
  ADD CONSTRAINT financial_transactions_refund_consistency CHECK (
    (status = 'REFUNDED' AND refunded_at IS NOT NULL AND length(trim(refund_reason)) >= 3)
    OR
    (status <> 'REFUNDED' AND refunded_at IS NULL AND refund_reason IS NULL AND refunded_by IS NULL)
  );

ALTER TABLE clinical_encounters
  ADD COLUMN IF NOT EXISTS correction_reason text,
  ADD COLUMN IF NOT EXISTS correction_completed_at timestamptz;

