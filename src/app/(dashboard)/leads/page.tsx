export const dynamic = 'force-dynamic';

import { getServerUserId, fetchLeads, fetchLeadStats, fetchCampaigns } from '@/lib/supabase/server';
import LeadsClient from './leads-client';

export default async function LeadsPage() {
    const userId = await getServerUserId();
    const [leads, stats, campaigns] = await Promise.all([
        fetchLeads(userId),
        fetchLeadStats(userId),
        fetchCampaigns(userId),
    ]);

    return <LeadsClient leads={leads} stats={stats} campaigns={campaigns} />;
}
