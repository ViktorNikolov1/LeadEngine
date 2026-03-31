import { fetchRuns, fetchRunStats } from '@/lib/supabase/server';
import LogsClient from './logs-client';

export default async function LogsPage() {
    const [runs, stats] = await Promise.all([
        fetchRuns(),
        fetchRunStats(),
    ]);

    return <LogsClient runs={runs} stats={stats} />;
}
