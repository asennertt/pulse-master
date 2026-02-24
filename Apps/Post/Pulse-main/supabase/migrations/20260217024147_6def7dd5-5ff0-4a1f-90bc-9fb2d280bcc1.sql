
-- Dealerships table
CREATE TABLE public.dealerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended')),
  owner_email TEXT,
  phone TEXT,
  address TEXT,
  onboarding_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  api_credentials_approved BOOLEAN NOT NULL DEFAULT false,
  max_vehicles INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dealerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on dealerships" ON public.dealerships FOR SELECT USING (true);
CREATE POLICY "Public insert on dealerships" ON public.dealerships FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update on dealerships" ON public.dealerships FOR UPDATE USING (true);
CREATE POLICY "Public delete on dealerships" ON public.dealerships FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_dealerships_updated_at
BEFORE UPDATE ON public.dealerships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activation queue
CREATE TABLE public.activation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'api_credentials',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on activation_queue" ON public.activation_queue FOR SELECT USING (true);
CREATE POLICY "Public insert on activation_queue" ON public.activation_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update on activation_queue" ON public.activation_queue FOR UPDATE USING (true);

-- Usage tracking per dealer
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealership_id UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'ai_post',
  credits_used INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read on usage_tracking" ON public.usage_tracking FOR SELECT USING (true);
CREATE POLICY "Public insert on usage_tracking" ON public.usage_tracking FOR INSERT WITH CHECK (true);

-- Seed demo dealerships
INSERT INTO public.dealerships (name, slug, subscription_tier, status, owner_email, api_credentials_approved) VALUES
  ('AutoMax Motors', 'automax', 'enterprise', 'active', 'admin@automax.com', true),
  ('Sunrise Auto Group', 'sunrise', 'pro', 'active', 'ops@sunriseauto.com', true),
  ('Metro Pre-Owned', 'metro', 'trial', 'inactive', 'info@metropreowned.com', false),
  ('Prestige Imports', 'prestige', 'pro', 'active', 'dealer@prestigeimports.com', true),
  ('Budget Wheels', 'budget', 'trial', 'inactive', 'contact@budgetwheels.com', false);

-- Seed activation queue entries
INSERT INTO public.activation_queue (dealership_id, request_type, status) 
SELECT id, 'api_credentials', 'pending' FROM public.dealerships WHERE api_credentials_approved = false;

-- Seed usage data
INSERT INTO public.usage_tracking (dealership_id, action_type, credits_used, created_at)
SELECT d.id, 
  (ARRAY['ai_post', 'image_optimize', 'listing_sync', 'lead_capture'])[floor(random()*4+1)],
  floor(random()*5+1)::int,
  now() - (random() * interval '30 days')
FROM public.dealerships d
CROSS JOIN generate_series(1, 25);
