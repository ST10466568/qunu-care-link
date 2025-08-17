-- Insert test patients
INSERT INTO public.patients (
  id,
  user_id,
  first_name,
  last_name,
  phone,
  email,
  date_of_birth,
  address,
  emergency_contact_name,
  emergency_contact_phone,
  patient_number
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'John',
  'Doe',
  '+1-555-0101',
  'john.doe@email.com',
  '1985-03-15',
  '123 Main St, Anytown, ST 12345',
  'Jane Doe',
  '+1-555-0102',
  'P001'
),
(
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'Sarah',
  'Wilson',
  '+1-555-0201',
  'sarah.wilson@email.com',
  '1992-07-22',
  '456 Oak Ave, Somewhere, ST 12346',
  'Mike Wilson',
  '+1-555-0202',
  'P002'
),
(
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  'Michael',
  'Johnson',
  '+1-555-0301',
  'michael.johnson@email.com',
  '1978-11-08',
  '789 Pine Rd, Elsewhere, ST 12347',
  'Lisa Johnson',
  '+1-555-0302',
  'P003'
);

-- Insert test staff (nurse, doctor, admin)
INSERT INTO public.staff (
  id,
  user_id,
  first_name,
  last_name,
  role,
  phone,
  staff_number,
  is_active
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  'Emily',
  'Rodriguez',
  'nurse',
  '+1-555-0401',
  'N001',
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555',
  'Dr. Robert',
  'Chen',
  'doctor',
  '+1-555-0501',
  'D001',
  true
),
(
  '66666666-6666-6666-6666-666666666666',
  '66666666-6666-6666-6666-666666666666',
  'Dr. Maria',
  'Garcia',
  'doctor',
  '+1-555-0601',
  'D002',
  true
),
(
  '77777777-7777-7777-7777-777777777777',
  '77777777-7777-7777-7777-777777777777',
  'David',
  'Thompson',
  'admin',
  '+1-555-0701',
  'A001',
  true
);

-- Insert test services
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

-- Insert sample appointments
INSERT INTO public.appointments (
  id,
  patient_id,
  service_id,
  staff_id,
  appointment_date,
  start_time,
  end_time,
  status,
  booking_type,
  notes
) VALUES 
(
  'appt0001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  '88888888-8888-8888-8888-888888888888',
  '55555555-5555-5555-5555-555555555555',
  '2025-08-20',
  '09:00:00',
  '09:30:00',
  'confirmed',
  'online',
  'Routine checkup - patient reports feeling well'
),
(
  'appt0002-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  '99999999-9999-9999-9999-999999999999',
  '44444444-4444-4444-4444-444444444444',
  '2025-08-21',
  '10:00:00',
  '10:15:00',
  'pending',
  'online',
  'Blood pressure monitoring - follow up from last visit'
),
(
  'appt0003-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '66666666-6666-6666-6666-666666666666',
  '2025-08-15',
  '14:00:00',
  '14:20:00',
  'completed',
  'online',
  'Flu vaccination administered successfully'
),
(
  'appt0004-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '55555555-5555-5555-5555-555555555555',
  '2025-08-22',
  '15:00:00',
  '15:25:00',
  'pending',
  'online',
  'Review recent blood work results'
);

-- Create notifications for upcoming appointments
INSERT INTO public.notifications (
  id,
  appointment_id,
  recipient,
  channel,
  type,
  message,
  status
) VALUES 
(
  'notif001-0000-0000-0000-000000000001',
  'appt0001-0000-0000-0000-000000000001',
  'john.doe@email.com',
  'email',
  'appointment_reminder',
  'Reminder: You have an appointment tomorrow at 9:00 AM with Dr. Robert Chen',
  'queued'
),
(
  'notif002-0000-0000-0000-000000000002',
  'appt0002-0000-0000-0000-000000000002',
  'sarah.wilson@email.com',
  'email',
  'appointment_confirmation',
  'Your appointment has been confirmed for August 21st at 10:00 AM',
  'sent'
);