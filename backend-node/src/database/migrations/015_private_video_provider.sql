ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_provider text NOT NULL DEFAULT 'JITSI' CHECK(video_provider IN('JITSI','DAILY','CUSTOM')), ADD COLUMN IF NOT EXISTS provider_room_name text;
