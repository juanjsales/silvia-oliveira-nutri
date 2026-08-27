ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'NUTRITIONIST';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'RECEPTIONIST';
ALTER TABLE staff_profiles ADD COLUMN activated_at timestamptz,ADD COLUMN activated_by uuid REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE staff_profiles ADD CONSTRAINT staff_profiles_activation_consistent CHECK((status='ACTIVE' AND activated_at IS NOT NULL AND activated_by IS NOT NULL) OR status<>'ACTIVE') NOT VALID;
-- No user is activated or promoted automatically. Existing owners are validated after audited backfill.
