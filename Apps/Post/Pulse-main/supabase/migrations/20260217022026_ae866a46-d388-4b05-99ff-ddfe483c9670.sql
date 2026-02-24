
-- Create leads table for Facebook Lead Form webhook data
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  vin TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'facebook',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS with public access (MVP, no auth yet)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on leads"
  ON public.leads FOR SELECT USING (true);

CREATE POLICY "Allow public insert on leads"
  ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on leads"
  ON public.leads FOR UPDATE USING (true);
