-- Add image_scores JSONB column to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_scores JSONB;

-- This stores an array of objects like:
-- [{"url": "...", "quality_score": 8, "flags": ["exterior"], "hero_candidate": true, "reason": "..."}]
