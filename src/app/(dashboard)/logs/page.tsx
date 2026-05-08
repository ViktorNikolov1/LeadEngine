export const dynamic = 'force-dynamic';

import { getServerUserId, fetchRuns, fetchRunStats } from '@/lib/supabase/server';
import LogsClient from './logs-client';

export default async function LogsPage() {
    const userId = await getServerUserId();
    const [runs, stats] = await Promise.all([
        fetchRuns(userId),
        fetchRunStats(userId),
    ]);

    return <LogsClient runs={runs} stats={stats} />;
}
