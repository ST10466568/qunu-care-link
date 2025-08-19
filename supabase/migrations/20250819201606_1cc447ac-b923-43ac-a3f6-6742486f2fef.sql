-- Update Patrick Ngontsa's role from admin to doctor so he appears in doctor selections
UPDATE staff 
SET role = 'doctor'
WHERE first_name = 'Patrick' AND last_name = 'Ngontsa' AND id = '2d81a3b6-c3b9-423c-804c-c971b9bdddbb';