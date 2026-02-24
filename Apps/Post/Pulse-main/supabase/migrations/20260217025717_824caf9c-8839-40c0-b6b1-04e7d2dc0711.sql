
-- Add Facebook token tracking columns to dealer_settings
ALTER TABLE public.dealer_settings
  ADD COLUMN IF NOT EXISTS fb_page_token text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_token_expires_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fb_token_status text NOT NULL DEFAULT 'not_connected';

-- fb_token_status values: 'not_connected', 'connected', 'expiring_soon', 'expired'

COMMENT ON COLUMN public.dealer_settings.fb_token_status IS 'Facebook token status: not_connected, connected, expiring_soon, expired';
