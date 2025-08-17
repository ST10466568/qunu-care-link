-- Insert test services first (no dependencies)
INSERT INTO public.services (
  id,
  name,
  description,
  duration_minutes,
  is_active
) VALUES 
(
  '88888888-8888-8888-8888-888888888888',
  'General Consultation',
  'Routine medical examination and consultation with a healthcare provider',
  30,
  true
),
(
  '99999999-9999-9999-9999-999999999999',
  'Blood Pressure Check',
  'Quick blood pressure monitoring and assessment',
  15,
  true
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Vaccination',
  'Administration of vaccines as per schedule or travel requirements',
  20,
  true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Physical Therapy Session',
  'Therapeutic exercises and rehabilitation treatment',
  60,
  true
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Lab Results Review',
  'Review and discussion of laboratory test results',
  25,
  true
);

-- Insert test time slots (Monday to Friday, 9 AM to 5 PM)
INSERT INTO public.time_slots (
  id,
  day_of_week,
  start_time,
  end_time,
  is_active
) VALUES 
-- Monday (1)
('slot001-0000-0000-0000-000000000001', 1, '09:00:00', '09:30:00', true),
('slot002-0000-0000-0000-000000000002', 1, '09:30:00', '10:00:00', true),
('slot003-0000-0000-0000-000000000003', 1, '10:00:00', '10:30:00', true),
('slot004-0000-0000-0000-000000000004', 1, '10:30:00', '11:00:00', true),
('slot005-0000-0000-0000-000000000005', 1, '11:00:00', '11:30:00', true),
('slot006-0000-0000-0000-000000000006', 1, '11:30:00', '12:00:00', true),
('slot007-0000-0000-0000-000000000007', 1, '13:00:00', '13:30:00', true),
('slot008-0000-0000-0000-000000000008', 1, '13:30:00', '14:00:00', true),
('slot009-0000-0000-0000-000000000009', 1, '14:00:00', '14:30:00', true),
('slot010-0000-0000-0000-000000000010', 1, '14:30:00', '15:00:00', true),
('slot011-0000-0000-0000-000000000011', 1, '15:00:00', '15:30:00', true),
('slot012-0000-0000-0000-000000000012', 1, '15:30:00', '16:00:00', true),
('slot013-0000-0000-0000-000000000013', 1, '16:00:00', '16:30:00', true),
('slot014-0000-0000-0000-000000000014', 1, '16:30:00', '17:00:00', true),

-- Tuesday (2)
('slot015-0000-0000-0000-000000000015', 2, '09:00:00', '09:30:00', true),
('slot016-0000-0000-0000-000000000016', 2, '09:30:00', '10:00:00', true),
('slot017-0000-0000-0000-000000000017', 2, '10:00:00', '10:30:00', true),
('slot018-0000-0000-0000-000000000018', 2, '10:30:00', '11:00:00', true),
('slot019-0000-0000-0000-000000000019', 2, '11:00:00', '11:30:00', true),
('slot020-0000-0000-0000-000000000020', 2, '11:30:00', '12:00:00', true),
('slot021-0000-0000-0000-000000000021', 2, '13:00:00', '13:30:00', true),
('slot022-0000-0000-0000-000000000022', 2, '13:30:00', '14:00:00', true),
('slot023-0000-0000-0000-000000000023', 2, '14:00:00', '14:30:00', true),
('slot024-0000-0000-0000-000000000024', 2, '14:30:00', '15:00:00', true),
('slot025-0000-0000-0000-000000000025', 2, '15:00:00', '15:30:00', true),
('slot026-0000-0000-0000-000000000026', 2, '15:30:00', '16:00:00', true),
('slot027-0000-0000-0000-000000000027', 2, '16:00:00', '16:30:00', true),
('slot028-0000-0000-0000-000000000028', 2, '16:30:00', '17:00:00', true);

COMMENT ON TABLE public.services IS 'Test data added: 5 sample services for clinic appointments';
COMMENT ON TABLE public.time_slots IS 'Test data added: Available time slots Monday-Tuesday, 9 AM to 5 PM';