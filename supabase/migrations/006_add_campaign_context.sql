-- Add context field to campaigns for campaign briefing documents
-- This stores markdown/text content that the AI uses when generating outreach emails
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS context TEXT;
