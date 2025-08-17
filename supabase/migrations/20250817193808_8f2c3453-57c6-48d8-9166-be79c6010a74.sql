-- Add staff schedules table for doctor availability
CREATE TABLE public.staff_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, day_of_week, start_time, end_time)
);

-- Add staff services junction table (which services each staff member can provide)
CREATE TABLE public.staff_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_id)
);

-- Enable RLS on new tables
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_schedules
CREATE POLICY "Staff schedules viewable by authenticated users" ON public.staff_schedules
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage their own schedules" ON public.staff_schedules
FOR ALL USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all schedules" ON public.staff_schedules
FOR ALL USING (
  EXISTS(
    SELECT 1 FROM public.get_current_user_staff_info() 
    WHERE role = 'admin' AND is_active = true
  )
);

-- RLS policies for staff_services
CREATE POLICY "Staff services viewable by authenticated users" ON public.staff_services
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage their own services" ON public.staff_services
FOR ALL USING (
  staff_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage all staff services" ON public.staff_services
FOR ALL USING (
  EXISTS(
    SELECT 1 FROM public.get_current_user_staff_info() 
    WHERE role = 'admin' AND is_active = true
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_staff_schedules_updated_at
  BEFORE UPDATE ON public.staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();