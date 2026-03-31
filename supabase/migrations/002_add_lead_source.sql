-- Add source column to track where leads come from
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'apify';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
