CREATE TABLE IF NOT EXISTS teleconsultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL UNIQUE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  room_key text NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'CREATED' CHECK (state IN (
    'CREATED','WAITING_PROFESSIONAL','WAITING_PATIENT','READY','CONNECTING',
    'CONNECTED','RECONNECTING','ENDED','FAILED','EXPIRED'
  )),
  professional_last_seen_at timestamptz,
  patient_last_seen_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  end_reason text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teleconsultation_sessions_patient_idx
  ON teleconsultation_sessions(patient_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS teleconsultation_sessions_expiry_idx
  ON teleconsultation_sessions(expires_at) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS teleconsultation_join_tokens (
  token_hash text PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES teleconsultation_sessions(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_role text NOT NULL CHECK (participant_role IN ('PROFESSIONAL','PATIENT')),
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teleconsultation_join_tokens_session_idx
  ON teleconsultation_join_tokens(session_id, actor_user_id);

CREATE TABLE IF NOT EXISTS teleconsultation_events (
  sequence bigserial PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES teleconsultation_sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teleconsultation_events_session_sequence_idx
  ON teleconsultation_events(session_id, sequence);
