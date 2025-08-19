-- Add a function to check for appointment overlaps
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS trigger AS $$
BEGIN
  -- Check if there are any overlapping appointments on the same date
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE appointment_date = NEW.appointment_date
    AND status != 'cancelled'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      -- New appointment starts before existing ends AND new appointment ends after existing starts
      (NEW.start_time < end_time AND NEW.end_time > start_time)
    )
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with an existing appointment on %', NEW.appointment_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent overlapping appointments
DROP TRIGGER IF EXISTS prevent_appointment_overlap ON appointments;
CREATE TRIGGER prevent_appointment_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_overlap();

-- Add helpful index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
ON appointments (appointment_date, start_time, end_time) 
WHERE status != 'cancelled';