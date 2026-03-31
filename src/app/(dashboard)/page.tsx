import { fetchLeadStats, fetchLeads, fetchEmailStats, fetchCampaigns } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
    const [leadStats, recentLeads, emailStats, campaigns] = await Promise.all([
        fetchLeadStats(),
        fetchLeads(),
        fetchEmailStats(),
        fetchCampaigns(),
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
