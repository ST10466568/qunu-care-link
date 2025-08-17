-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is a patient or staff based on metadata
  IF NEW.raw_user_meta_data->>'user_type' = 'patient' THEN
    INSERT INTO public.patients (
      user_id,
      first_name,
      last_name,
      phone,
      email
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.email
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'staff' THEN
    INSERT INTO public.staff (
      user_id,
      first_name,
      last_name,
      role,
      phone
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      COALESCE(NEW.raw_user_meta_data->>'role', 'nurse'),
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();