-- Insert test services
INSERT INTO public.services (
  name,
  description,
  duration_minutes,
  is_active
) VALUES 
(
  'General Consultation',
  'Routine medical examination and consultation with a healthcare provider',
  30,
  true
),
(
  'Blood Pressure Check',
  'Quick blood pressure monitoring and assessment',
  15,
  true
),
(
  'Vaccination',
  'Administration of vaccines as per schedule or travel requirements',
  20,
  true
),
(
  'Physical Therapy Session',
  'Therapeutic exercises and rehabilitation treatment',
  60,
  true
),
(
  'Lab Results Review',
  'Review and discussion of laboratory test results',
  25,
  true
);

-- Insert test time slots (Monday to Friday, 9 AM to 5 PM)
INSERT INTO public.time_slots (
  day_of_week,
  start_time,
  end_time,
  is_active
) VALUES 
-- Monday (1)
(1, '09:00:00', '09:30:00', true),
(1, '09:30:00', '10:00:00', true),
(1, '10:00:00', '10:30:00', true),
(1, '10:30:00', '11:00:00', true),
(1, '11:00:00', '11:30:00', true),
(1, '11:30:00', '12:00:00', true),
(1, '13:00:00', '13:30:00', true),
(1, '13:30:00', '14:00:00', true),
(1, '14:00:00', '14:30:00', true),
(1, '14:30:00', '15:00:00', true),
(1, '15:00:00', '15:30:00', true),
(1, '15:30:00', '16:00:00', true),
(1, '16:00:00', '16:30:00', true),
(1, '16:30:00', '17:00:00', true),

-- Tuesday (2)
(2, '09:00:00', '09:30:00', true),
(2, '09:30:00', '10:00:00', true),
(2, '10:00:00', '10:30:00', true),
(2, '10:30:00', '11:00:00', true),
(2, '11:00:00', '11:30:00', true),
(2, '11:30:00', '12:00:00', true),
(2, '13:00:00', '13:30:00', true),
(2, '13:30:00', '14:00:00', true),
(2, '14:00:00', '14:30:00', true),
(2, '14:30:00', '15:00:00', true),
(2, '15:00:00', '15:30:00', true),
(2, '15:30:00', '16:00:00', true),
(2, '16:00:00', '16:30:00', true),
(2, '16:30:00', '17:00:00', true),

-- Wednesday (3)
(3, '09:00:00', '09:30:00', true),
(3, '09:30:00', '10:00:00', true),
(3, '10:00:00', '10:30:00', true),
(3, '10:30:00', '11:00:00', true),
(3, '11:00:00', '11:30:00', true),
(3, '11:30:00', '12:00:00', true),
(3, '13:00:00', '13:30:00', true),
(3, '13:30:00', '14:00:00', true),
(3, '14:00:00', '14:30:00', true),
(3, '14:30:00', '15:00:00', true),
(3, '15:00:00', '15:30:00', true),
(3, '15:30:00', '16:00:00', true),
(3, '16:00:00', '16:30:00', true),
(3, '16:30:00', '17:00:00', true),

-- Thursday (4)
(4, '09:00:00', '09:30:00', true),
(4, '09:30:00', '10:00:00', true),
(4, '10:00:00', '10:30:00', true),
(4, '10:30:00', '11:00:00', true),
(4, '11:00:00', '11:30:00', true),
(4, '11:30:00', '12:00:00', true),
(4, '13:00:00', '13:30:00', true),
(4, '13:30:00', '14:00:00', true),
(4, '14:00:00', '14:30:00', true),
(4, '14:30:00', '15:00:00', true),
(4, '15:00:00', '15:30:00', true),
(4, '15:30:00', '16:00:00', true),
(4, '16:00:00', '16:30:00', true),
(4, '16:30:00', '17:00:00', true),

-- Friday (5)
(5, '09:00:00', '09:30:00', true),
(5, '09:30:00', '10:00:00', true),
(5, '10:00:00', '10:30:00', true),
(5, '10:30:00', '11:00:00', true),
(5, '11:00:00', '11:30:00', true),
(5, '11:30:00', '12:00:00', true),
(5, '13:00:00', '13:30:00', true),
(5, '13:30:00', '14:00:00', true),
(5, '14:00:00', '14:30:00', true),
(5, '14:30:00', '15:00:00', true),
(5, '15:00:00', '15:30:00', true),
(5, '15:30:00', '16:00:00', true),
(5, '16:00:00', '16:30:00', true),
(5, '16:30:00', '17:00:00', true);