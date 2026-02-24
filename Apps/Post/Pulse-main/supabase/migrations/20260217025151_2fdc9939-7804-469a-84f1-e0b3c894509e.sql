
-- 1. App role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'dealer_admin', 'dealer_user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  dealership_id uuid REFERENCES public.dealerships(id) ON DELETE SET NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  onboarding_step integer NOT NULL DEFAULT 0,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Invitation links table
CREATE TABLE public.invitation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dealership_name text DEFAULT '',
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- 6. Function to get user's dealership_id
CREATE OR REPLACE FUNCTION public.get_my_dealership_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dealership_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- 7. Add dealer_id to all tenant tables
ALTER TABLE public.vehicles ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.ingestion_logs ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.sold_alerts ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.vehicle_performance ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.dealer_settings ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;
ALTER TABLE public.dms_field_mappings ADD COLUMN dealer_id uuid REFERENCES public.dealerships(id) ON DELETE CASCADE;

-- 8. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Update timestamp trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. RLS policies for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 11. RLS policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 12. RLS policies for invitation_links
CREATE POLICY "Super admins can manage invitations" ON public.invitation_links
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can read valid invitation by token" ON public.invitation_links
  FOR SELECT USING (true);

-- 13. Drop old permissive policies and create tenant-aware ones for vehicles
DROP POLICY IF EXISTS "Allow public read access on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public insert on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public update on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public delete on vehicles" ON public.vehicles;

CREATE POLICY "Tenant read vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert vehicles" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update vehicles" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant delete vehicles" ON public.vehicles
  FOR DELETE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 14. Tenant policies for leads
DROP POLICY IF EXISTS "Allow public read on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update on leads" ON public.leads;

CREATE POLICY "Tenant read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- Also allow anon insert for lead webhooks
CREATE POLICY "Anon insert leads via webhook" ON public.leads
  FOR INSERT TO anon WITH CHECK (true);

-- 15. Tenant policies for staff
DROP POLICY IF EXISTS "Allow public read on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow public insert on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow public update on staff" ON public.staff;

CREATE POLICY "Tenant read staff" ON public.staff
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert staff" ON public.staff
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update staff" ON public.staff
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 16. Tenant policies for ingestion_logs
DROP POLICY IF EXISTS "Allow public read on ingestion_logs" ON public.ingestion_logs;
DROP POLICY IF EXISTS "Allow public insert on ingestion_logs" ON public.ingestion_logs;

CREATE POLICY "Tenant read ingestion_logs" ON public.ingestion_logs
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert ingestion_logs" ON public.ingestion_logs
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- Allow anon insert for edge functions
CREATE POLICY "Anon insert ingestion_logs" ON public.ingestion_logs
  FOR INSERT TO anon WITH CHECK (true);

-- 17. Tenant policies for sold_alerts
DROP POLICY IF EXISTS "Allow public read on sold_alerts" ON public.sold_alerts;
DROP POLICY IF EXISTS "Allow public insert on sold_alerts" ON public.sold_alerts;
DROP POLICY IF EXISTS "Allow public update on sold_alerts" ON public.sold_alerts;

CREATE POLICY "Tenant read sold_alerts" ON public.sold_alerts
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert sold_alerts" ON public.sold_alerts
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update sold_alerts" ON public.sold_alerts
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 18. Tenant policies for vehicle_performance
DROP POLICY IF EXISTS "Allow public read on vehicle_performance" ON public.vehicle_performance;
DROP POLICY IF EXISTS "Allow public insert on vehicle_performance" ON public.vehicle_performance;
DROP POLICY IF EXISTS "Allow public update on vehicle_performance" ON public.vehicle_performance;

CREATE POLICY "Tenant read vehicle_performance" ON public.vehicle_performance
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert vehicle_performance" ON public.vehicle_performance
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update vehicle_performance" ON public.vehicle_performance
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 19. Tenant policies for dealer_settings
DROP POLICY IF EXISTS "Public read on dealer_settings" ON public.dealer_settings;
DROP POLICY IF EXISTS "Public insert on dealer_settings" ON public.dealer_settings;
DROP POLICY IF EXISTS "Public update on dealer_settings" ON public.dealer_settings;

CREATE POLICY "Tenant read dealer_settings" ON public.dealer_settings
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert dealer_settings" ON public.dealer_settings
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update dealer_settings" ON public.dealer_settings
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 20. Tenant policies for dms_field_mappings
DROP POLICY IF EXISTS "Allow public read on dms_field_mappings" ON public.dms_field_mappings;
DROP POLICY IF EXISTS "Allow public insert on dms_field_mappings" ON public.dms_field_mappings;
DROP POLICY IF EXISTS "Allow public update on dms_field_mappings" ON public.dms_field_mappings;
DROP POLICY IF EXISTS "Allow public delete on dms_field_mappings" ON public.dms_field_mappings;

CREATE POLICY "Tenant read dms_field_mappings" ON public.dms_field_mappings
  FOR SELECT TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert dms_field_mappings" ON public.dms_field_mappings
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant update dms_field_mappings" ON public.dms_field_mappings
  FOR UPDATE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant delete dms_field_mappings" ON public.dms_field_mappings
  FOR DELETE TO authenticated
  USING (dealer_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- 21. Update dealerships table policies (super admin only for management)
DROP POLICY IF EXISTS "Public read on dealerships" ON public.dealerships;
DROP POLICY IF EXISTS "Public insert on dealerships" ON public.dealerships;
DROP POLICY IF EXISTS "Public update on dealerships" ON public.dealerships;
DROP POLICY IF EXISTS "Public delete on dealerships" ON public.dealerships;

CREATE POLICY "Authenticated read own dealership" ON public.dealerships
  FOR SELECT TO authenticated
  USING (id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin insert dealerships" ON public.dealerships
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin update dealerships" ON public.dealerships
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin delete dealerships" ON public.dealerships
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow anon read for onboarding token validation
CREATE POLICY "Anon read dealerships for onboarding" ON public.dealerships
  FOR SELECT TO anon USING (true);

-- 22. Update activation_queue policies
DROP POLICY IF EXISTS "Public read on activation_queue" ON public.activation_queue;
DROP POLICY IF EXISTS "Public insert on activation_queue" ON public.activation_queue;
DROP POLICY IF EXISTS "Public update on activation_queue" ON public.activation_queue;

CREATE POLICY "Super admin read activation_queue" ON public.activation_queue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated insert activation_queue" ON public.activation_queue
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin update activation_queue" ON public.activation_queue
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 23. Update usage_tracking policies
DROP POLICY IF EXISTS "Public read on usage_tracking" ON public.usage_tracking;
DROP POLICY IF EXISTS "Public insert on usage_tracking" ON public.usage_tracking;

CREATE POLICY "Tenant read usage_tracking" ON public.usage_tracking
  FOR SELECT TO authenticated
  USING (dealership_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant insert usage_tracking" ON public.usage_tracking
  FOR INSERT TO authenticated
  WITH CHECK (dealership_id = public.get_my_dealership_id() OR public.has_role(auth.uid(), 'super_admin'));

-- Allow anon insert for edge functions
CREATE POLICY "Anon insert usage_tracking" ON public.usage_tracking
  FOR INSERT TO anon WITH CHECK (true);

-- 24. Add indexes for tenant queries
CREATE INDEX idx_vehicles_dealer_id ON public.vehicles(dealer_id);
CREATE INDEX idx_leads_dealer_id ON public.leads(dealer_id);
CREATE INDEX idx_staff_dealer_id ON public.staff(dealer_id);
CREATE INDEX idx_ingestion_logs_dealer_id ON public.ingestion_logs(dealer_id);
CREATE INDEX idx_sold_alerts_dealer_id ON public.sold_alerts(dealer_id);
CREATE INDEX idx_vehicle_performance_dealer_id ON public.vehicle_performance(dealer_id);
CREATE INDEX idx_dealer_settings_dealer_id ON public.dealer_settings(dealer_id);
CREATE INDEX idx_profiles_dealership_id ON public.profiles(dealership_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
