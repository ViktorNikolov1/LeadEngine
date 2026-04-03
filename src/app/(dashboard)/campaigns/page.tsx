export const dynamic = 'force-dynamic';

import { fetchCampaigns, fetchCampaignLeadCounts } from '@/lib/supabase/server';
import CampaignsClient from './campaigns-client';

export default async function CampaignsPage() {
    const [campaigns, leadCounts] = await Promise.all([
        fetchCampaigns(),
        fetchCampaignLeadCounts(),
    ]);

    return <CampaignsClient campaigns={campaigns} leadCounts={leadCounts} />;
}
