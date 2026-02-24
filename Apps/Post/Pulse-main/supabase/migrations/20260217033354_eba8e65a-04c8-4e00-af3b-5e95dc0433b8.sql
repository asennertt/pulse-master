
-- Add SFTP credential columns to dealerships
ALTER TABLE public.dealerships
  ADD COLUMN IF NOT EXISTS sftp_username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS sftp_password_hash TEXT;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_dealerships_sftp_username ON public.dealerships (sftp_username);
