export const dynamic = 'force-dynamic';

import { getServerUserId, fetchEmails, fetchEmailStats, fetchLeads, fetchCampaigns } from '@/lib/supabase/server';
import { isEmailConfigured } from '@/lib/email/sendgrid';
import { isOpenRouterConfigured } from '@/lib/ai/openrouter';
import OutreachClient from './outreach-client';

export default async function OutreachPage() {
    const userId = await getServerUserId();
    const [emails, stats, allLeads, campaigns] = await Promise.all([
        fetchEmails(userId),
        fetchEmailStats(userId),
        fetchLeads(userId),
        fetchCampaigns(userId),
    ]);

    // Only pass minimal lead data needed for the selector
    const leads = allLeads.map(l => ({
        id: l.id,
        full_name: l.full_name,
        email: l.email,
        company_name: l.company_name,
    }));

    const campaignOptions = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
    }));

    return (
        <OutreachClient
            initialEmails={emails}
            initialStats={stats}
            leads={leads}
            campaigns={campaignOptions}
            emailConfigured={isEmailConfigured()}
            aiConfigured={isOpenRouterConfigured()}
        />
    );
}
