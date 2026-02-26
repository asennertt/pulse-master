-- =============================================================================
-- 001_unified_auth_migration.sql
-- Unified Supabase Auth: dealer_value_user role + auto-assign trigger
-- =============================================================================

-- 1. Create the dealer_value_user role (safe: does nothing if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'dealer_value_user'
  ) THEN
    CREATE ROLE dealer_value_user;
  END IF;
END
$$;

-- 2. Table: user_roles
--    Stores which roles each Supabase user has been granted.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service-role / admin can insert/update/delete
CREATE POLICY "Service role can manage roles"
  ON public.user_roles
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Function: auto-assign dealer_value_user on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dealer_value_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Trigger: fire after every new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_role();

-- 5. Helper view: expose current user’s roles to the client (via Supabase client)
CREATE OR REPLACE VIEW public.my_roles AS
  SELECT role, granted_at
  FROM   public.user_roles
  WHERE  user_id = auth.uid();

-- Grant SELECT on the view to the anon and authenticated roles
GRANT SELECT ON public.my_roles TO anon, authenticated;
