import { fetchLeads, fetchLeadStats } from '@/lib/supabase/server';
import type { Lead } from '@/types';
import LeadsClient from './leads-client';

export default async function LeadsPage() {
    const [leads, stats] = await Promise.all([
        fetchLeads(),
        fetchLeadStats(),
    ]);

    return <LeadsClient leads={leads} stats={stats} />;
}
