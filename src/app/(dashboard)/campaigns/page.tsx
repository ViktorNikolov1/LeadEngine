export const dynamic = 'force-dynamic';

import { getServerUserId, fetchCampaigns, fetchCampaignLeadCounts } from '@/lib/supabase/server';
import CampaignsClient from './campaigns-client';

export default async function CampaignsPage() {
    const userId = await getServerUserId();
    const [campaigns, leadCounts] = await Promise.all([
        fetchCampaigns(userId),
        fetchCampaignLeadCounts(userId),
    ]);

    return <CampaignsClient campaigns={campaigns} leadCounts={leadCounts} />;
}
