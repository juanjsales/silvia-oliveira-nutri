UPDATE appointments
SET video_provider = 'JITSI', meeting_url = NULL, provider_room_name = NULL, updated_at = now()
WHERE video_provider = 'DAILY';
