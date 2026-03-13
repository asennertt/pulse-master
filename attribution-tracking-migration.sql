-- Attribution Tracking Migration for Pulse Post
-- Adds first_posted_at, sold_at, days_to_sell to vehicles
-- Creates posting_events table with RLS
-- Adds triggers for auto-computing sold_at, days_to_sell, first_posted_at

-- ============================================================
-- 1. Add columns to vehicles table
-- ============================================================

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS first_posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS days_to_sell INT;

-- ============================================================
-- 2. Create posting_events table
-- ============================================================

CREATE TABLE IF NOT EXISTS posting_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  dealership_id UUID REFERENCES dealerships(id),
  staff_id UUID REFERENCES staff(id),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('posted', 'renewed', 'removed')),
  fb_listing_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posting_events_vehicle_id ON posting_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_posting_events_dealership_id ON posting_events(dealership_id);
CREATE INDEX IF NOT EXISTS idx_posting_events_staff_id ON posting_events(staff_id);
CREATE INDEX IF NOT EXISTS idx_posting_events_created_at ON posting_events(created_at DESC);

-- ============================================================
-- 3. RLS policies on posting_events
-- ============================================================

ALTER TABLE posting_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert posting_events for their dealership"
  ON posting_events
  FOR INSERT
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Users can view posting_events for their dealership"
  ON posting_events
  FOR SELECT
  USING (dealership_id = get_my_dealership_id());

-- ============================================================
-- 4. Trigger: when status changes to 'sold', set sold_at and compute days_to_sell
-- ============================================================

CREATE OR REPLACE FUNCTION set_sold_at_and_days_to_sell()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND (OLD.status IS DISTINCT FROM 'sold') THEN
    NEW.sold_at := now();
    IF NEW.first_posted_at IS NOT NULL THEN
      NEW.days_to_sell := EXTRACT(DAY FROM (now() - NEW.first_posted_at))::INT;
    ELSE
      NEW.days_to_sell := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_sold_at ON vehicles;
CREATE TRIGGER trg_set_sold_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_sold_at_and_days_to_sell();

-- ============================================================
-- 5. Trigger: when last_posted_at is set and first_posted_at is NULL, set first_posted_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_first_posted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_posted_at IS NOT NULL AND NEW.first_posted_at IS NULL THEN
    NEW.first_posted_at := NEW.last_posted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_first_posted_at ON vehicles;
CREATE TRIGGER trg_set_first_posted_at
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION set_first_posted_at();

-- ============================================================
-- 6. Backfill existing data
-- ============================================================

UPDATE vehicles
SET first_posted_at = last_posted_at
WHERE last_posted_at IS NOT NULL
  AND first_posted_at IS NULL;
