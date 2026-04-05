import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('id, industry, campaign_id, full_name, company_name, job_title, email')
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const leads = data ?? [];

        const industries: Record<string, { total: number; unassigned: number }> = {};

        for (const lead of leads) {
            const ind = lead.industry ?? 'uncategorized';
            if (!industries[ind]) {
                industries[ind] = { total: 0, unassigned: 0 };
            }
            industries[ind].total++;
            if (!lead.campaign_id) {
                industries[ind].unassigned++;
            }
        }

        const sorted = Object.entries(industries)
            .sort(([, a], [, b]) => b.unassigned - a.unassigned)
            .map(([industry, counts]) => ({
                industry,
                ...counts,
            }));

        return NextResponse.json({
            industries: sorted,
            totalUnassigned: leads.filter(l => !l.campaign_id).length,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
