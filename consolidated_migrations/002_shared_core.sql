-- =============================================================================
-- 002_shared_core.sql
-- SHARED: Tables and functions used by ALL Pulse apps (Post, Value, Landing)
-- 
-- This file owns: profiles, user_roles, dealerships, signup triggers,
--                  helper functions (has_role, get_my_dealership_id, etc.)
-- =============================================================================

-- ------------------------------------------------
-- Utility function: auto-update updated_at columns
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- ------------------------------------------------
-- Dealerships table (shared — every Pulse app needs it)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dealerships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_tier IN ('trial', 'pro', 'enterprise')),
  status        TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  owner_email   TEXT,
  phone         TEXT,
  address       TEXT,
  onboarding_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  api_credentials_approved BOOLEAN NOT NULL DEFAULT false,
  max_vehicles  INTEGER NOT NULL DEFAULT 50,
  sftp_username TEXT UNIQUE,
  sftp_password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_dealerships_updated_at
  BEFORE UPDATE ON public.dealerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------
-- Profiles table (shared — every app reads profile)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id     UUID REFERENCES public.dealerships(id) ON DELETE SET NULL,
  full_name         TEXT DEFAULT '',
  avatar_url        TEXT DEFAULT '',
  dealership_name   TEXT,
  phone             TEXT,
  onboarding_step   INTEGER NOT NULL DEFAULT 0,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dealership_id ON public.profiles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_dealerships_sftp_username ON public.dealerships(sftp_username);


-- ------------------------------------------------
-- User roles table (shared — every app checks roles)
-- Uses plain TEXT for role column so both Post and Value
-- can define their own role names without enum conflicts.
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------
-- Invitation links (shared — Post uses now, Value may later)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitation_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  dealership_id   UUID REFERENCES public.dealerships(id),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dealership_name TEXT DEFAULT '',
  used_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------
-- Activation queue (shared admin feature)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activation_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id   UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL DEFAULT 'api_credentials',
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied')),
  notes           TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------
-- Usage tracking (shared billing feature)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id   UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  action_type     TEXT NOT NULL DEFAULT 'ai_post',
  credits_used    INTEGER NOT NULL DEFAULT 1,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------
-- Helper: check if a user has a specific role
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


-- ------------------------------------------------
-- Helper: get calling user's dealership_id
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_dealership_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dealership_id FROM public.profiles WHERE user_id = auth.uid()
$$;


-- ------------------------------------------------
-- SIGNUP TRIGGER: auto-create profile + assign roles
-- This is the ONE trigger on auth.users for new signups.
-- It handles BOTH profile creation AND role assignment.
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create the profile row
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Assign dealer_admin role (every new signup owns their dealership)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dealer_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Assign dealer_user role (general authenticated user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dealer_user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop ALL old trigger variants, then create the one true trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------
-- Helper view: expose current user's roles
-- ------------------------------------------------
CREATE OR REPLACE VIEW public.my_roles AS
  SELECT role, granted_at
  FROM public.user_roles
  WHERE user_id = auth.uid();

GRANT SELECT ON public.my_roles TO anon, authenticated;
