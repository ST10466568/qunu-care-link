-- Fix security definer functions by setting search_path
CREATE OR REPLACE FUNCTION public.get_current_user_staff_info()
RETURNS TABLE(user_id uuid, is_active boolean, role text)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
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
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.staff 
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;