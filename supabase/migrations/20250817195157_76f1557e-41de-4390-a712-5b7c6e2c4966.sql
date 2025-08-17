-- Update existing appointments to assign them to the doctor
UPDATE appointments 
SET staff_id = '2d81a3b6-c3b9-423c-804c-c971b9bdddbb'
WHERE staff_id IS NULL;

-- Insert some schedule data for the doctor
INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_active) VALUES
('2d81a3b6-c3b9-423c-804c-c971b9bdddbb', 1, '09:00', '17:00', true), -- Monday
('2d81a3b6-c3b9-423c-804c-c971b9bdddbb', 2, '09:00', '17:00', true), -- Tuesday  
('2d81a3b6-c3b9-423c-804c-c971b9bdddbb', 3, '09:00', '17:00', true), -- Wednesday
('2d81a3b6-c3b9-423c-804c-c971b9bdddbb', 4, '09:00', '17:00', true), -- Thursday
('2d81a3b6-c3b9-423c-804c-c971b9bdddbb', 5, '09:00', '17:00', true); -- Friday