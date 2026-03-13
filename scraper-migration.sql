-- Website Inventory Scraper — migration
-- Adds scraper configuration to dealer_settings and source tracking to vehicles

-- ── dealer_settings columns ─────────────────────────────
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS ingestion_method TEXT NOT NULL DEFAULT 'csv';
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS scraper_url TEXT;
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS scraper_frequency_hours INT NOT NULL DEFAULT 24;
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS scraper_last_run TIMESTAMPTZ;
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS scraper_status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE dealer_settings ADD COLUMN IF NOT EXISTS scraper_vehicle_count INT NOT NULL DEFAULT 0;

-- ── vehicles columns ────────────────────────────────────
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source_url TEXT;
