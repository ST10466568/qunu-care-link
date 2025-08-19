-- Create table for tracking staff availability by date
CREATE TABLE public.staff_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  availability_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, availability_date)
);

-- Enable RLS
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for staff availability
CREATE POLICY "Staff can manage their own availability" 
ON public.staff_availability 
FOR ALL 
USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage all staff availability" 
ON public.staff_availability 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM get_current_user_staff_info() 
  WHERE role = 'admin' AND is_active = true
));

CREATE POLICY "Staff availability viewable by authenticated users" 
ON public.staff_availability 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_staff_availability_updated_at
BEFORE UPDATE ON public.staff_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add doctor_id column to appointments table
ALTER TABLE public.appointments ADD COLUMN doctor_id UUID;

-- Create function to get available doctors for a date
CREATE OR REPLACE FUNCTION public.get_available_doctors_for_date(check_date DATE)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  staff_number TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT s.id, s.first_name, s.last_name, s.staff_number
  FROM staff s
  WHERE s.role = 'doctor' 
    AND s.is_active = true
    AND (
      -- Doctor is available by default (no record for this date)
      NOT EXISTS (
        SELECT 1 FROM staff_availability sa 
        WHERE sa.staff_id = s.id AND sa.availability_date = check_date
      )
      OR 
      -- Doctor has explicitly set themselves as available
      EXISTS (
        SELECT 1 FROM staff_availability sa 
        WHERE sa.staff_id = s.id 
          AND sa.availability_date = check_date 
          AND sa.is_available = true
      )
    )
  ORDER BY s.first_name, s.last_name;
$$;