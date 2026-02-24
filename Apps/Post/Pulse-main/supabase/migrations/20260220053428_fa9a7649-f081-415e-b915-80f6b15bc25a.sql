
-- Add listing sync fields to vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS last_posted_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fb_listing_url text DEFAULT NULL;
