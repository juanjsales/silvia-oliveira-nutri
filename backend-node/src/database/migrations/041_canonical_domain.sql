-- Preserve links created before the canonical production domain changed.
UPDATE appointments
SET meeting_url = replace(meeting_url, 'https://silvia-oliveira-nutri-v2.vercel.app', 'https://silviaoliveira.vercel.app'),
    updated_at = now()
WHERE meeting_url LIKE 'https://silvia-oliveira-nutri-v2.vercel.app/%';

UPDATE clinic_settings
SET logo_url = replace(logo_url, 'https://silvia-oliveira-nutri-v2.vercel.app', 'https://silviaoliveira.vercel.app'),
    portrait_url = replace(portrait_url, 'https://silvia-oliveira-nutri-v2.vercel.app', 'https://silviaoliveira.vercel.app'),
    full_body_url = replace(full_body_url, 'https://silvia-oliveira-nutri-v2.vercel.app', 'https://silviaoliveira.vercel.app'),
    consultation_image_url = replace(consultation_image_url, 'https://silvia-oliveira-nutri-v2.vercel.app', 'https://silviaoliveira.vercel.app'),
    updated_at = now()
WHERE coalesce(logo_url, '') LIKE 'https://silvia-oliveira-nutri-v2.vercel.app/%'
   OR coalesce(portrait_url, '') LIKE 'https://silvia-oliveira-nutri-v2.vercel.app/%'
   OR coalesce(full_body_url, '') LIKE 'https://silvia-oliveira-nutri-v2.vercel.app/%'
   OR coalesce(consultation_image_url, '') LIKE 'https://silvia-oliveira-nutri-v2.vercel.app/%';
