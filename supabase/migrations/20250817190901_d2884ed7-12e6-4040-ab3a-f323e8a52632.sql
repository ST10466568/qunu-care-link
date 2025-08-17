-- Create clinic management system tables

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  staff_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'nurse', 'admin')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  patient_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time slots table
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  booking_type TEXT NOT NULL DEFAULT 'online' CHECK (booking_type IN ('online', 'walk_in', 'phone')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent double booking
  UNIQUE(appointment_date, start_time, staff_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder_24h', 'reminder_2h', 'cancellation', 'rescheduled')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services (public read, staff can manage)
CREATE POLICY "Services are viewable by everyone" 
ON public.services FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage services" 
ON public.services FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- RLS Policies for staff (staff can view other staff, admin can manage)
CREATE POLICY "Staff can view active staff" 
ON public.staff FOR SELECT 
USING (
  is_active = true AND (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.staff WHERE staff.user_id = auth.uid() AND staff.is_active = true)
  )
);

CREATE POLICY "Staff can update their own profile" 
ON public.staff FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage staff" 
ON public.staff FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.role = 'admin' AND staff.is_active = true
  )
);

-- RLS Policies for patients (patients see own data, staff see all)
CREATE POLICY "Patients can view their own profile" 
ON public.patients FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Patients can update their own profile" 
ON public.patients FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all patients" 
ON public.patients FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

CREATE POLICY "Staff can manage patients" 
ON public.patients FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- RLS Policies for time slots (everyone can read, staff can manage)
CREATE POLICY "Time slots are viewable by everyone" 
ON public.time_slots FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage time slots" 
ON public.time_slots FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments" 
ON public.appointments FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE patients.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can create their own appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients WHERE patients.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can update their own pending appointments" 
ON public.appointments FOR UPDATE 
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE patients.user_id = auth.uid()
  ) AND status = 'pending'
);

CREATE POLICY "Staff can view all appointments" 
ON public.appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

CREATE POLICY "Staff can manage all appointments" 
ON public.appointments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- RLS Policies for notifications (staff only)
CREATE POLICY "Staff can view all notifications" 
ON public.notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

CREATE POLICY "Staff can manage notifications" 
ON public.notifications FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.staff 
    WHERE staff.user_id = auth.uid() AND staff.is_active = true
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, description, duration_minutes) VALUES
('General Consultation', 'General medical consultation and examination', 30),
('Maternity Care', 'Prenatal and postnatal care', 45),
('Child Immunization', 'Childhood vaccinations and immunizations', 15),
('Chronic Illness Management', 'Management of chronic conditions like diabetes, hypertension', 30),
('Family Planning', 'Family planning consultation and services', 30),
('Minor Emergency Care', 'Treatment of minor injuries and emergencies', 20);

-- Insert default time slots (Monday to Friday, 8:00-16:00)
INSERT INTO public.time_slots (day_of_week, start_time, end_time) VALUES
-- Monday
(1, '08:00', '08:30'),
(1, '08:30', '09:00'),
(1, '09:00', '09:30'),
(1, '09:30', '10:00'),
(1, '10:00', '10:30'),
(1, '10:30', '11:00'),
(1, '11:00', '11:30'),
(1, '11:30', '12:00'),
(1, '13:00', '13:30'),
(1, '13:30', '14:00'),
(1, '14:00', '14:30'),
(1, '14:30', '15:00'),
(1, '15:00', '15:30'),
(1, '15:30', '16:00'),
-- Tuesday
(2, '08:00', '08:30'),
(2, '08:30', '09:00'),
(2, '09:00', '09:30'),
(2, '09:30', '10:00'),
(2, '10:00', '10:30'),
(2, '10:30', '11:00'),
(2, '11:00', '11:30'),
(2, '11:30', '12:00'),
(2, '13:00', '13:30'),
(2, '13:30', '14:00'),
(2, '14:00', '14:30'),
(2, '14:30', '15:00'),
(2, '15:00', '15:30'),
(2, '15:30', '16:00'),
-- Wednesday
(3, '08:00', '08:30'),
(3, '08:30', '09:00'),
(3, '09:00', '09:30'),
(3, '09:30', '10:00'),
(3, '10:00', '10:30'),
(3, '10:30', '11:00'),
(3, '11:00', '11:30'),
(3, '11:30', '12:00'),
(3, '13:00', '13:30'),
(3, '13:30', '14:00'),
(3, '14:00', '14:30'),
(3, '14:30', '15:00'),
(3, '15:00', '15:30'),
(3, '15:30', '16:00'),
-- Thursday
(4, '08:00', '08:30'),
(4, '08:30', '09:00'),
(4, '09:00', '09:30'),
(4, '09:30', '10:00'),
(4, '10:00', '10:30'),
(4, '10:30', '11:00'),
(4, '11:00', '11:30'),
(4, '11:30', '12:00'),
(4, '13:00', '13:30'),
(4, '13:30', '14:00'),
(4, '14:00', '14:30'),
(4, '14:30', '15:00'),
(4, '15:00', '15:30'),
(4, '15:30', '16:00'),
-- Friday
(5, '08:00', '08:30'),
(5, '08:30', '09:00'),
(5, '09:00', '09:30'),
(5, '09:30', '10:00'),
(5, '10:00', '10:30'),
(5, '10:30', '11:00'),
(5, '11:00', '11:30'),
(5, '11:30', '12:00'),
(5, '13:00', '13:30'),
(5, '13:30', '14:00'),
(5, '14:00', '14:30'),
(5, '14:30', '15:00'),
(5, '15:00', '15:30'),
(5, '15:30', '16:00');