
-- Per-user vehicle posting tracker
-- Each salesperson's posting is independent from others
CREATE TABLE public.user_vehicle_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  dealer_id uuid NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,
  posted_at timestamp with time zone NOT NULL DEFAULT now(),
  fb_listing_url text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE public.user_vehicle_postings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own postings
CREATE POLICY "Users read own postings"
  ON public.user_vehicle_postings FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own postings
CREATE POLICY "Users insert own postings"
  ON public.user_vehicle_postings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own postings
CREATE POLICY "Users update own postings"
  ON public.user_vehicle_postings FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own postings
CREATE POLICY "Users delete own postings"
  ON public.user_vehicle_postings FOR DELETE
  USING (user_id = auth.uid());

-- Super admins can see all
CREATE POLICY "Super admins read all postings"
  ON public.user_vehicle_postings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_user_vehicle_postings_user ON public.user_vehicle_postings(user_id);
CREATE INDEX idx_user_vehicle_postings_vehicle ON public.user_vehicle_postings(vehicle_id);
CREATE INDEX idx_user_vehicle_postings_posted ON public.user_vehicle_postings(posted_at);
