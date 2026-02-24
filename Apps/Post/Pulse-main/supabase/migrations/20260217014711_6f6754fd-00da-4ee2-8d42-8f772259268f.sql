
-- Create vehicle status enum
CREATE TYPE public.vehicle_status AS ENUM ('available', 'pending', 'sold');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vin TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT,
  mileage INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  exterior_color TEXT,
  status public.vehicle_status NOT NULL DEFAULT 'available',
  images TEXT[] DEFAULT '{}',
  facebook_post_id TEXT,
  synced_to_facebook BOOLEAN NOT NULL DEFAULT false,
  days_on_lot INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public access for now since no auth yet)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth requirement for this MVP)
CREATE POLICY "Allow public read access on vehicles"
  ON public.vehicles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on vehicles"
  ON public.vehicles FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on vehicles"
  ON public.vehicles FOR DELETE
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
