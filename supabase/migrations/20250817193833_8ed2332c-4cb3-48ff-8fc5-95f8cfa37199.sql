-- Add some test staff members and their schedules
INSERT INTO public.staff (user_id, first_name, last_name, role, phone, is_active)
VALUES 
  (gen_random_uuid(), 'Dr. Sarah', 'Johnson', 'doctor', '+27123456789', true),
  (gen_random_uuid(), 'Dr. Michael', 'Smith', 'doctor', '+27123456790', true),
  (gen_random_uuid(), 'Nurse Mary', 'Williams', 'nurse', '+27123456791', true)
ON CONFLICT DO NOTHING;

-- Get the staff IDs for scheduling
WITH staff_data AS (
  SELECT id, first_name, last_name, role FROM public.staff 
  WHERE first_name IN ('Dr. Sarah', 'Dr. Michael', 'Nurse Mary')
),
service_data AS (
  SELECT id, name FROM public.services
)

-- Insert staff schedules (Monday to Friday, 9 AM to 5 PM)
INSERT INTO public.staff_schedules (staff_id, day_of_week, start_time, end_time, is_active)
SELECT 
  s.id,
  dow.day_of_week,
  '09:00:00'::time,
  '17:00:00'::time,
  true
FROM staff_data s
CROSS JOIN (
  SELECT generate_series(1, 5) as day_of_week
) dow
ON CONFLICT DO NOTHING;

-- Link staff to services they can provide
WITH staff_data AS (
  SELECT id, first_name, role FROM public.staff 
  WHERE first_name IN ('Dr. Sarah', 'Dr. Michael', 'Nurse Mary')
),
service_data AS (
  SELECT id, name FROM public.services
)
INSERT INTO public.staff_services (staff_id, service_id)
SELECT 
  s.id,
  srv.id
FROM staff_data s
CROSS JOIN service_data srv
WHERE 
  (s.role = 'doctor' AND srv.name IN ('General Consultation', 'Lab Results Review', 'Physical Therapy Session')) OR
  (s.role = 'nurse' AND srv.name IN ('Blood Pressure Check', 'Vaccination'))
ON CONFLICT DO NOTHING;