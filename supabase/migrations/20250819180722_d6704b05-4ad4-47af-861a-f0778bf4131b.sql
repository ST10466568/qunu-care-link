-- Check if the placeholder UUID causes issues and update the patient creation policy
-- Allow staff to create walk-in patients with placeholder user_id

-- First, let's add a policy specifically for walk-in patient creation
CREATE POLICY "Staff can create walk-in patients"
ON public.patients
FOR INSERT
USING (
  EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.user_id = auth.uid() 
    AND staff.is_active = true
  )
)
WITH CHECK (
  user_id = '00000000-0000-0000-0000-000000000000'::uuid 
  AND EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.user_id = auth.uid() 
    AND staff.is_active = true
  )
);