
-- Staff members table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  facebook_account TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'salesperson',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert on staff" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on staff" ON public.staff FOR UPDATE USING (true);

-- Add staff assignment to vehicles
ALTER TABLE public.vehicles ADD COLUMN assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD COLUMN posted_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Vehicle performance tracking
CREATE TABLE public.vehicle_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  post_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  click_count INTEGER NOT NULL DEFAULT 0,
  days_live INTEGER NOT NULL DEFAULT 0,
  renewed_at TIMESTAMP WITH TIME ZONE,
  last_click_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

ALTER TABLE public.vehicle_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on vehicle_performance" ON public.vehicle_performance FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vehicle_performance" ON public.vehicle_performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on vehicle_performance" ON public.vehicle_performance FOR UPDATE USING (true);

-- Sold alerts table
CREATE TABLE public.sold_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  vin TEXT NOT NULL,
  vehicle_label TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sold_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on sold_alerts" ON public.sold_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sold_alerts" ON public.sold_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sold_alerts" ON public.sold_alerts FOR UPDATE USING (true);

-- Trigger for vehicle_performance updated_at
CREATE TRIGGER update_vehicle_performance_updated_at
BEFORE UPDATE ON public.vehicle_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
