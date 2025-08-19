-- Update the function to include proper search_path for security
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there are any overlapping appointments on the same date
  IF EXISTS (
    SELECT 1 FROM public.appointments 
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
$$;