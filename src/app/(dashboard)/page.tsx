export const dynamic = 'force-dynamic';

import { getServerUserId, fetchLeadStats, fetchLeads, fetchEmailStats, fetchCampaigns } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
    const userId = await getServerUserId();
    const [leadStats, recentLeads, emailStats, campaigns] = await Promise.all([
        fetchLeadStats(userId),
        fetchLeads(userId),
        fetchEmailStats(userId),
        fetchCampaigns(userId),
    ]);

    return (
        <DashboardClient
            leadStats={leadStats}
            recentLeads={recentLeads.slice(0, 5)}
            totalLeads={recentLeads.length}
            emailStats={emailStats}
            totalCampaigns={campaigns.length}
        />
    );
}
