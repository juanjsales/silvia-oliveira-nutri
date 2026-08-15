CREATE OR REPLACE FUNCTION prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('CONFIRMED', 'WAITING', 'IN_PROGRESS') THEN
    -- Serialize reservations for the same day, including concurrent requests.
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.appointment_date::text, 0));
    IF EXISTS (
      SELECT 1 FROM appointments existing
      WHERE existing.id IS DISTINCT FROM NEW.id
        AND existing.appointment_date = NEW.appointment_date
        AND existing.status IN ('CONFIRMED', 'WAITING', 'IN_PROGRESS')
        AND existing.appointment_date + existing.appointment_time < NEW.appointment_date + NEW.appointment_time + NEW.duration_minutes * interval '1 minute'
        AND existing.appointment_date + existing.appointment_time + existing.duration_minutes * interval '1 minute' > NEW.appointment_date + NEW.appointment_time
    ) THEN
      RAISE EXCEPTION 'appointment time overlaps an existing appointment' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_prevent_overlap ON appointments;
CREATE TRIGGER appointments_prevent_overlap
BEFORE INSERT OR UPDATE OF appointment_date, appointment_time, duration_minutes, status ON appointments
FOR EACH ROW EXECUTE FUNCTION prevent_appointment_overlap();
