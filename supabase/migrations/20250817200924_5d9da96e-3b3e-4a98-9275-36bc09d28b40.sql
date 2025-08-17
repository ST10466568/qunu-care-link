-- First, let me check if there are any existing staff users and make one of them an admin
-- Update the first staff user to be an admin (this should be the doctor you signed up with)
UPDATE staff 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM staff 
  WHERE role IN ('doctor', 'nurse') 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- If no staff exists, we'll need to create one after someone signs up
-- The handle_new_user function will automatically create staff profiles 
-- when someone signs up with user_type = 'staff' in their metadata