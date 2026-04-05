-- Migration: Add user_id column to all tables and enable Row Level Security
-- This ensures tenant isolation — users can only access their own data.

-- ============================================================
-- 1. Add user_id columns
-- ============================================================

ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE runs ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE emails ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE email_events ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Indexes for user_id filtering
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_email_events_user_id ON email_events(user_id);

-- ============================================================
-- 2. Claim existing data for the first user (if exactly one exists)
-- This is safe for single-tenant setups during initial deployment.
-- ============================================================

DO $$
DECLARE
    _user_id UUID;
    _user_count INT;
BEGIN
    SELECT COUNT(*) INTO _user_count FROM auth.users;
    IF _user_count = 1 THEN
        SELECT id INTO _user_id FROM auth.users LIMIT 1;
        UPDATE campaigns SET user_id = _user_id WHERE user_id IS NULL;
        UPDATE leads SET user_id = _user_id WHERE user_id IS NULL;
        UPDATE runs SET user_id = _user_id WHERE user_id IS NULL;
        UPDATE emails SET user_id = _user_id WHERE user_id IS NULL;
        UPDATE email_events SET user_id = _user_id WHERE user_id IS NULL;
        RAISE NOTICE 'Claimed all existing data for user %', _user_id;
    ELSE
        RAISE NOTICE 'Found % users — skipping auto-claim. Run manual UPDATE to set user_id.', _user_count;
    END IF;
END $$;

-- ============================================================
-- 3. Enable RLS on all tables
-- ============================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS Policies — users can only access their own rows
-- ============================================================

-- Campaigns
CREATE POLICY "Users can view own campaigns"
    ON campaigns FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
    ON campaigns FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
    ON campaigns FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns"
    ON campaigns FOR DELETE
    USING (user_id = auth.uid());

-- Leads
CREATE POLICY "Users can view own leads"
    ON leads FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own leads"
    ON leads FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own leads"
    ON leads FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own leads"
    ON leads FOR DELETE
    USING (user_id = auth.uid());

-- Runs
CREATE POLICY "Users can view own runs"
    ON runs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own runs"
    ON runs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own runs"
    ON runs FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Emails
CREATE POLICY "Users can view own emails"
    ON emails FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own emails"
    ON emails FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own emails"
    ON emails FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own emails"
    ON emails FOR DELETE
    USING (user_id = auth.uid());

-- Email Events
CREATE POLICY "Users can view own email events"
    ON email_events FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email events"
    ON email_events FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. Service role bypass — the service_role key still has full access
-- for server-side operations (Server Components, webhooks, etc.)
-- This is by design in Supabase.
-- ============================================================

-- To manually claim existing data for a specific user, run:
-- UPDATE campaigns SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- UPDATE leads SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- UPDATE runs SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- UPDATE emails SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
-- UPDATE email_events SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;
