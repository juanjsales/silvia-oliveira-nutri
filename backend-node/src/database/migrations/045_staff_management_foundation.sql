-- Additive staff-management foundation. Invitation acceptance and user
-- provisioning are intentionally deferred while users.role remains legacy.
CREATE TABLE staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 160)
);

CREATE TABLE staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED')),
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  accepted_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_invites_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT staff_invites_display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 160),
  CONSTRAINT staff_invites_expiration_after_creation CHECK (expires_at > created_at),
  CONSTRAINT staff_invites_acceptance_consistent CHECK (
    (status = 'ACCEPTED' AND accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL)
    OR (status <> 'ACCEPTED' AND accepted_at IS NULL AND accepted_by_user_id IS NULL)
  ),
  CONSTRAINT staff_invites_cancellation_consistent CHECK (
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
    OR (status <> 'CANCELLED' AND cancelled_at IS NULL)
  )
);

CREATE UNIQUE INDEX staff_invites_pending_email_key
  ON staff_invites (lower(email)) WHERE status = 'PENDING';
CREATE INDEX staff_invites_status_expiration_idx ON staff_invites(status, expires_at);
CREATE INDEX staff_profiles_status_idx ON staff_profiles(status, user_id);

-- Existing administrators become visible as owners without changing users.role.
INSERT INTO staff_profiles (user_id, display_name, created_by)
SELECT u.id,
  CASE WHEN char_length(split_part(u.email, '@', 1)) >= 2 THEN split_part(u.email, '@', 1) ELSE u.email END,
  u.id
FROM users u
WHERE u.role::text = 'ADMIN'
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON staff_profiles, staff_invites FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON staff_profiles, staff_invites FROM authenticated;
  END IF;
END $$;
