// TODO: Generate from Supabase CLI with `supabase gen types typescript`
// For now, define manual types matching the schema

export type Campaign = {
    id: string;
    user_id: string | null;
    name: string;
    search_criteria: Record<string, unknown> | null;
    status: 'active' | 'paused' | 'completed';
    target_leads: number | null;
    created_at: string;
    updated_at: string;
};

export type Lead = {
    id: string;
    user_id: string | null;
    campaign_id: string | null;
    linkedin_url: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    headline: string | null;
    location: string | null;
    company_name: string | null;
    company_domain: string | null;
    company_linkedin_url: string | null;
    job_title: string | null;
    industry: string | null;
    status: 'new' | 'enriched' | 'contacted' | 'replied' | 'disqualified';
    enrichment_data: Record<string, unknown> | null;
    source: string | null;
    created_at: string;
    updated_at: string;
};

export type Run = {
    id: string;
    campaign_id: string | null;
    apify_run_id: string | null;
    leads_processed: number;
    status: 'started' | 'success' | 'failed';
    created_at: string;
};

export type EmailStatus = 'draft' | 'approved' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';

export type Email = {
    id: string;
    lead_id: string;
    campaign_id: string | null;
    from_email: string;
    to_email: string;
    subject: string;
    body_html: string;
    body_text: string | null;
    status: EmailStatus;
    provider_message_id: string | null;
    approved_at: string | null;
    sent_at: string | null;
    delivered_at: string | null;
    opened_at: string | null;
    clicked_at: string | null;
    created_at: string;
    updated_at: string;
};

export type EmailWithLead = Email & {
    lead: Pick<Lead, 'id' | 'full_name' | 'email' | 'company_name' | 'job_title'>;
};

export type EmailEventType = 'send' | 'delivery' | 'open' | 'click' | 'bounce' | 'complaint';

export type EmailEvent = {
    id: string;
    email_id: string;
    event_type: EmailEventType;
    event_data: Record<string, unknown> | null;
    created_at: string;
};

export type EmailStats = {
    total: number;
    drafts: number;
    approved: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
};