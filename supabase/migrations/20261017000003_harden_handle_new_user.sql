-- Fix search_path on the SECURITY DEFINER trigger function to prevent schema hijacking.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'display_name',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;
