-- Fix walk-in patient creation by making user_id nullable and removing foreign key constraint
-- This allows walk-in patients to have NULL user_id instead of a placeholder

-- First, drop the foreign key constraint
ALTER TABLE public.patients 
DROP CONSTRAINT IF EXISTS patients_user_id_fkey;

-- Make user_id nullable to allow walk-in patients
ALTER TABLE public.patients 
ALTER COLUMN user_id DROP NOT NULL;

-- Update the RLS policy for walk-in patients to use NULL instead of placeholder UUID
DROP POLICY IF EXISTS "Staff can create walk-in patients" ON public.patients;

CREATE POLICY "Staff can create walk-in patients"
ON public.patients
FOR INSERT
WITH CHECK (
  user_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM staff 
    WHERE staff.user_id = auth.uid() 
    AND staff.is_active = true
  )
);

-- Also need to update the policy for patients to view their own profile to handle NULL user_id
DROP POLICY IF EXISTS "Patients can view their own profile" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own profile" ON public.patients;

CREATE POLICY "Patients can view their own profile" 
ON public.patients 
FOR SELECT 
USING (user_id = auth.uid() AND user_id IS NOT NULL);

CREATE POLICY "Patients can update their own profile" 
ON public.patients 
FOR UPDATE 
USING (user_id = auth.uid() AND user_id IS NOT NULL);