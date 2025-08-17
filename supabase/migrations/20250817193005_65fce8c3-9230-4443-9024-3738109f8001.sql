-- Fix infinite recursion in staff RLS policies by creating security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_staff_info()
RETURNS TABLE(user_id uuid, is_active boolean, role text)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT s.user_id, s.is_active, s.role 
  FROM public.staff s 
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_active_staff()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Staff can view active staff" ON public.staff;
DROP POLICY IF EXISTS "Admin can manage staff" ON public.staff;

-- Create new policies using security definer functions
CREATE POLICY "Staff can view active staff" ON public.staff
FOR SELECT USING (
  is_active = true AND (
    auth.uid() = user_id OR 
    public.is_current_user_active_staff()
  )
);

CREATE POLICY "Admin can manage staff" ON public.staff
FOR ALL USING (
  EXISTS(
    SELECT 1 FROM public.get_current_user_staff_info() 
    WHERE role = 'admin' AND is_active = true
  )
);

-- Create the missing trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();