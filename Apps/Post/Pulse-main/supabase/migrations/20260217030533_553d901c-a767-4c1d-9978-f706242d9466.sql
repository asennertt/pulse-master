
-- Create price_history table
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  dealer_id uuid REFERENCES public.dealerships(id),
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  change_amount numeric GENERATED ALWAYS AS (new_price - old_price) STORED,
  change_percent numeric GENERATED ALWAYS AS (
    CASE WHEN old_price > 0 THEN ROUND(((new_price - old_price) / old_price) * 100, 2) ELSE 0 END
  ) STORED,
  source text NOT NULL DEFAULT 'DMS Sync',
  change_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add last_price_change to vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS last_price_change timestamp with time zone DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Tenant-aware policies
CREATE POLICY "Tenant read price_history"
  ON public.price_history FOR SELECT
  USING (dealer_id = get_my_dealership_id() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant insert price_history"
  ON public.price_history FOR INSERT
  WITH CHECK (dealer_id = get_my_dealership_id() OR has_role(auth.uid(), 'super_admin'::app_role));

-- Allow edge functions (service role) to insert via anon for webhook/cron
CREATE POLICY "Anon insert price_history"
  ON public.price_history FOR INSERT
  WITH CHECK (true);

-- Enable realtime for price_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_history;

-- Index for fast lookups
CREATE INDEX idx_price_history_vehicle_id ON public.price_history(vehicle_id);
CREATE INDEX idx_price_history_change_date ON public.price_history(change_date DESC);
CREATE INDEX idx_vehicles_last_price_change ON public.vehicles(last_price_change);
