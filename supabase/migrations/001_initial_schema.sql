-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns Table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    search_criteria JSONB, -- Stores the configuraton used for scraping
    status TEXT DEFAULT 'active', -- active, paused, completed
    target_leads INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    
    -- Identification
    linkedin_url TEXT UNIQUE NOT NULL, -- Core deduplication key
    email TEXT,
    
    -- Basic Info
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    headline TEXT,
    location TEXT,
    
    -- Company Info
    company_name TEXT,
    company_domain TEXT,
    company_linkedin_url TEXT,
    job_title TEXT,
    
    -- Status & Enrichment
    status TEXT DEFAULT 'new', -- new, enriched, contacted, replied, disqualified
    enrichment_data JSONB, -- Store full JSON from Apify/Enrichment here
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runs Table (Log scraping executions)
CREATE TABLE runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id),
    apify_run_id TEXT,
    leads_processed INT DEFAULT 0,
    status TEXT, -- started, success, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for frequent queries
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
