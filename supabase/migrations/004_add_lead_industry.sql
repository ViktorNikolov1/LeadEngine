-- Add industry classification column to leads
ALTER TABLE leads ADD COLUMN industry TEXT;

-- Index for filtering leads by industry
CREATE INDEX idx_leads_industry ON leads(industry);
