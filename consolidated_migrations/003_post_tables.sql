-- =============================================================================
-- 003_post_tables.sql
-- POST-SPECIFIC: Tables used only by Pulse Post
--
-- Depends on: 002_shared_core.sql (dealerships, profiles, helpers)
-- =============================================================================


-- ------------------------------------------------
-- Vehicle status enum
-- ------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE public.vehicle_status AS ENUM ('available', 'pending', 'sold');
  END IF;
END
$$;


-- ------------------------------------------------
-- Vehicles
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id     UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  vin               TEXT NOT NULL,
  make              TEXT NOT NULL,
  model             TEXT NOT NULL,
  year              INTEGER NOT NULL,
  trim              TEXT,
  mileage           INTEGER NOT NULL DEFAULT 0,
  price             DECIMAL(12,2) NOT NULL DEFAULT 0,
  exterior_color    TEXT,
  status            public.vehicle_status NOT NULL DEFAULT 'available',
  images            TEXT[] DEFAULT '{}',
  facebook_post_id  TEXT,
  synced_to_facebook BOOLEAN NOT NULL DEFAULT false,
  days_on_lot       INTEGER NOT NULL DEFAULT 0,
  leads             INTEGER NOT NULL DEFAULT 0,
  assigned_staff_id UUID,
  posted_by_staff_id UUID,
  last_price_change TIMESTAMPTZ DEFAULT NULL,
  last_posted_at    TIMESTAMPTZ DEFAULT NULL,
  fb_listing_url    TEXT DEFAULT NULL,
  ai_description    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealership_id, vin)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vehicles_dealership_id ON public.vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_price_change ON public.vehicles(last_price_change);


-- ------------------------------------------------
-- Staff (salespeople per dealership)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id   UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  facebook_account TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'salesperson',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_dealership_id ON public.staff(dealership_id);

-- Now add the FK constraints on vehicles -> staff
ALTER TABLE public.vehicles
  ADD CONSTRAINT fk_vehicles_assigned_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles
  ADD CONSTRAINT fk_vehicles_posted_by_staff
    FOREIGN KEY (posted_by_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;


-- ------------------------------------------------
-- Leads (Facebook lead form webhook data)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  vin           TEXT NOT NULL,
  vehicle_id    UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  source        TEXT NOT NULL DEFAULT 'facebook',
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leads_dealership_id ON public.leads(dealership_id);


-- ------------------------------------------------
-- Vehicle performance tracking
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_performance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  vehicle_id    UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  post_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  click_count   INTEGER NOT NULL DEFAULT 0,
  days_live     INTEGER NOT NULL DEFAULT 0,
  renewed_at    TIMESTAMPTZ,
  last_click_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

ALTER TABLE public.vehicle_performance ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_vehicle_performance_updated_at
  BEFORE UPDATE ON public.vehicle_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vehicle_performance_dealership ON public.vehicle_performance(dealership_id);


-- ------------------------------------------------
-- Sold alerts
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sold_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  vehicle_id    UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  staff_id      UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  vin           TEXT NOT NULL,
  vehicle_label TEXT NOT NULL,
  acknowledged  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sold_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sold_alerts_dealership ON public.sold_alerts(dealership_id);


-- ------------------------------------------------
-- Dealer settings (per-dealership config for Post)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dealer_settings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id          UUID UNIQUE REFERENCES public.dealerships(id) ON DELETE CASCADE,
  dealership_name        TEXT NOT NULL DEFAULT '',
  dba                    TEXT DEFAULT '',
  primary_phone          TEXT DEFAULT '',
  address                TEXT DEFAULT '',
  website_url            TEXT DEFAULT '',
  logo_url               TEXT DEFAULT '',
  brand_color            TEXT DEFAULT '#1e90ff',
  auto_post_new_inventory BOOLEAN NOT NULL DEFAULT false,
  auto_renew_listings     BOOLEAN NOT NULL DEFAULT false,
  auto_renew_days         INTEGER NOT NULL DEFAULT 7,
  price_markup            NUMERIC NOT NULL DEFAULT 0,
  delete_on_sold          BOOLEAN NOT NULL DEFAULT true,
  global_system_prompt    TEXT DEFAULT '',
  auto_blur_plates        BOOLEAN NOT NULL DEFAULT false,
  fb_page_token           TEXT DEFAULT NULL,
  fb_token_expires_at     TIMESTAMPTZ DEFAULT NULL,
  fb_token_status         TEXT NOT NULL DEFAULT 'not_connected',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dealer_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_dealer_settings_updated_at
  BEFORE UPDATE ON public.dealer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------
-- DMS field mappings
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dms_field_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  dms_source  TEXT NOT NULL DEFAULT 'default',
  dms_field   TEXT NOT NULL,
  app_field   TEXT NOT NULL,
  transform   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dealership_id, dms_source, dms_field)
);

ALTER TABLE public.dms_field_mappings ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------
-- Ingestion logs (feed processing history)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingestion_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id    UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  source           TEXT NOT NULL,
  feed_type        TEXT NOT NULL DEFAULT 'XML',
  vehicles_scanned INTEGER NOT NULL DEFAULT 0,
  new_vehicles     INTEGER NOT NULL DEFAULT 0,
  marked_sold      INTEGER NOT NULL DEFAULT 0,
  images_fetched   INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'success',
  message          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_dealership ON public.ingestion_logs(dealership_id);


-- ------------------------------------------------
-- Price history
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id  UUID REFERENCES public.dealerships(id) ON DELETE CASCADE,
  vehicle_id     UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  old_price      NUMERIC NOT NULL,
  new_price      NUMERIC NOT NULL,
  change_amount  NUMERIC GENERATED ALWAYS AS (new_price - old_price) STORED,
  change_percent NUMERIC GENERATED ALWAYS AS (
    CASE WHEN old_price > 0
         THEN ROUND(((new_price - old_price) / old_price) * 100, 2)
         ELSE 0
    END
  ) STORED,
  source         TEXT NOT NULL DEFAULT 'DMS Sync',
  change_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_price_history_vehicle_id ON public.price_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_price_history_change_date ON public.price_history(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_dealership ON public.price_history(dealership_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.price_history;


-- ------------------------------------------------
-- Per-user vehicle posting tracker
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_vehicle_postings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  vehicle_id  UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  dealer_id   UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  posted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fb_listing_url TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

ALTER TABLE public.user_vehicle_postings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_vehicle_postings_user ON public.user_vehicle_postings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicle_postings_vehicle ON public.user_vehicle_postings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicle_postings_posted ON public.user_vehicle_postings(posted_at);


-- ------------------------------------------------
-- Seed default field mappings (global defaults, no dealership_id)
-- ------------------------------------------------
INSERT INTO public.dms_field_mappings (dms_source, dms_field, app_field)
VALUES
  ('default', 'Stock_Number', 'vin'),
  ('default', 'VIN',          'vin'),
  ('default', 'Retail_Price', 'price'),
  ('default', 'MSRP',         'price'),
  ('default', 'Vehicle_Make', 'make'),
  ('default', 'Vehicle_Model','model'),
  ('default', 'Model_Year',   'year'),
  ('default', 'Trim_Level',   'trim'),
  ('default', 'Odometer',     'mileage'),
  ('default', 'Ext_Color',    'exterior_color'),
  ('default', 'Photo_URLs',   'images'),
  ('default', 'Days_In_Stock','days_on_lot')
ON CONFLICT DO NOTHING;
