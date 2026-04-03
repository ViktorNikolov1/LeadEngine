import { fetchLeads, fetchLeadStats, fetchCampaigns } from '@/lib/supabase/server';
import LeadsClient from './leads-client';

export default async function LeadsPage() {
    const [leads, stats, campaigns] = await Promise.all([
        fetchLeads(),
        fetchLeadStats(),
        fetchCampaigns(),
    ]);

    return <LeadsClient leads={leads} stats={stats} campaigns={campaigns} />;
}
