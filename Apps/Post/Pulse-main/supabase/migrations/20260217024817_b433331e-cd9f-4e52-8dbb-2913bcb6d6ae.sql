
-- Settings table for dealership configuration
CREATE TABLE public.dealer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dealership Profile
  dealership_name text NOT NULL DEFAULT '',
  dba text DEFAULT '',
  primary_phone text DEFAULT '',
  address text DEFAULT '',
  website_url text DEFAULT '',
  logo_url text DEFAULT '',
  brand_color text DEFAULT '#1e90ff',
  -- Automation Rules
  auto_post_new_inventory boolean NOT NULL DEFAULT false,
  auto_renew_listings boolean NOT NULL DEFAULT false,
  auto_renew_days integer NOT NULL DEFAULT 7,
  price_markup numeric NOT NULL DEFAULT 0,
  delete_on_sold boolean NOT NULL DEFAULT true,
  -- AI Customization
  global_system_prompt text DEFAULT '',
  auto_blur_plates boolean NOT NULL DEFAULT false,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on dealer_settings" ON public.dealer_settings FOR SELECT USING (true);
CREATE POLICY "Public insert on dealer_settings" ON public.dealer_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update on dealer_settings" ON public.dealer_settings FOR UPDATE USING (true);

CREATE TRIGGER update_dealer_settings_updated_at
  BEFORE UPDATE ON public.dealer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default row
INSERT INTO public.dealer_settings (dealership_name, dba) VALUES ('My Dealership', '');
