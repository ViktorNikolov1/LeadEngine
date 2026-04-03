import { createClient } from '@supabase/supabase-js';
import type { EmailStatus } from '@/types';

export function createServerClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase env vars:', {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
            SUPABASE_SERVICE_ROLE_KEY: supabaseKey ? 'set' : 'MISSING',
        });
        throw new Error('Supabase server env vars not configured');
    }

    return createClient(supabaseUrl, supabaseKey);
}

export async function fetchLeads() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return [];
    }
    return data ?? [];
}

export async function fetchCampaigns() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }
    return data ?? [];
}

export async function fetchCampaignLeadCounts() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('leads')
        .select('campaign_id, status, industry');

    if (error) {
        console.error('Error fetching lead counts:', error);
        return {};
    }

    const counts: Record<string, { total: number; byStatus: Record<string, number>; industries: Record<string, number> }> = {};
    for (const lead of data ?? []) {
        const cid = lead.campaign_id;
        if (!cid) continue;
        if (!counts[cid]) counts[cid] = { total: 0, byStatus: {}, industries: {} };
        counts[cid].total++;
        counts[cid].byStatus[lead.status] = (counts[cid].byStatus[lead.status] ?? 0) + 1;
        if (lead.industry) {
            counts[cid].industries[lead.industry] = (counts[cid].industries[lead.industry] ?? 0) + 1;
        }
    }
    return counts;
}

export async function fetchLeadStats() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('leads')
        .select('status');

    if (error) {
        console.error('Error fetching lead stats:', error);
        return { new: 0, enriched: 0, contacted: 0, replied: 0, disqualified: 0 };
    }

    const stats: Record<string, number> = {
        new: 0,
        enriched: 0,
        contacted: 0,
        replied: 0,
        disqualified: 0,
    };

    for (const lead of data ?? []) {
        if (lead.status in stats) {
            stats[lead.status]++;
        }
    }
    return stats;
}

export async function fetchRuns() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('runs')
        .select('*, campaign:campaigns(id, name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching runs:', error);
        return [];
    }
    return data ?? [];
}

export async function fetchRunStats() {
    const supabase = createServerClient();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('runs')
        .select('status, created_at');

    if (error) {
        console.error('Error fetching run stats:', error);
        return { total24h: 0, successRate: 0, active: 0, failed: 0 };
    }

    const all = data ?? [];
    const last24h = all.filter(r => new Date(r.created_at) >= yesterday);
    const succeeded = last24h.filter(r => r.status === 'success').length;
    const active = all.filter(r => r.status === 'started').length;
    const failed = last24h.filter(r => r.status === 'failed').length;
    const successRate = last24h.length > 0 ? Math.round((succeeded / last24h.length) * 100) : 0;

    return { total24h: last24h.length, successRate, active, failed };
}

export async function fetchLeadById(id: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching lead:', error);
        return null;
    }
    return data;
}

export async function fetchEmails(filters?: { status?: string; search?: string }) {
    const supabase = createServerClient();
    let query = supabase
        .from('emails')
        .select('*, lead:leads(id, full_name, email, company_name, job_title)')
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,to_email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching emails:', error);
        return [];
    }
    return data ?? [];
}

export async function fetchEmailById(id: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('emails')
        .select('*, lead:leads(id, full_name, email, company_name, job_title)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching email:', error);
        return null;
    }
    return data;
}

export async function fetchEmailStats() {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('emails')
        .select('status, opened_at, clicked_at');

    if (error) {
        console.error('Error fetching email stats:', error);
        return { total: 0, drafts: 0, approved: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    }

    const stats = { total: 0, drafts: 0, approved: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };

    for (const email of data ?? []) {
        stats.total++;
        switch (email.status as EmailStatus) {
            case 'draft': stats.drafts++; break;
            case 'approved': stats.approved++; break;
            case 'sent': stats.sent++; break;
            case 'delivered': stats.delivered++; break;
            case 'bounced': stats.bounced++; break;
            case 'complained': stats.bounced++; break;
            case 'failed': break;
        }
        if (email.opened_at) stats.opened++;
        if (email.clicked_at) stats.clicked++;
    }

    return stats;
}

export async function createEmail(data: {
    lead_id: string;
    campaign_id?: string;
    from_email: string;
    to_email: string;
    subject: string;
    body_html: string;
    body_text?: string;
}) {
    const supabase = createServerClient();
    const { data: email, error } = await supabase
        .from('emails')
        .insert({ ...data, status: 'draft' })
        .select()
        .single();

    if (error) {
        console.error('Error creating email:', error);
        return null;
    }
    return email;
}

export async function updateEmail(id: string, updates: Record<string, unknown>) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('emails')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating email:', error);
        return null;
    }
    return data;
}

export async function deleteEmail(id: string) {
    const supabase = createServerClient();
    const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting email:', error);
        return false;
    }
    return true;
}

export async function insertEmailEvent(emailId: string, eventType: string, eventData?: Record<string, unknown>) {
    const supabase = createServerClient();
    const { error } = await supabase
        .from('email_events')
        .insert({ email_id: emailId, event_type: eventType, event_data: eventData ?? null });

    if (error) {
        console.error('Error inserting email event:', error);
        return false;
    }
    return true;
}
