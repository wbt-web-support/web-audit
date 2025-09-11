-- Add limitations column to plans table
-- This script adds a separate limitations column to store plan limitations separately from features

-- Add the limitations column
ALTER TABLE plans 
ADD COLUMN limitations JSONB DEFAULT '{}'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN plans.limitations IS 'Plan limitations and constraints stored as JSONB';

-- Create an index on the limitations column for better query performance
CREATE INDEX IF NOT EXISTS idx_plans_limitations ON plans USING GIN (limitations);

-- Optional: Migrate existing limit data from features to limitations
-- This will move any keys that match limit patterns from features to limitations
UPDATE plans 
SET limitations = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(features)
  WHERE key ~* '(max_|min_|limit|quota|threshold|capacity|rate|per_|allowed|restricted|constraint|queue_priority|wait_time|api_calls|storage|concurrent|timeout|retry|backoff)'
),
features = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(features)
  WHERE key !~* '(max_|min_|limit|quota|threshold|capacity|rate|per_|allowed|restricted|constraint|queue_priority|wait_time|api_calls|storage|concurrent|timeout|retry|backoff)'
)
WHERE features IS NOT NULL AND features != '{}'::jsonb;

-- Verify the migration
SELECT 
  id, 
  name, 
  jsonb_object_keys(features) as feature_keys,
  jsonb_object_keys(limitations) as limitation_keys
FROM plans 
WHERE features IS NOT NULL OR limitations IS NOT NULL;
