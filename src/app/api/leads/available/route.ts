import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Returns leads grouped by industry that are available to be assigned to campaigns.
 * Includes both unassigned leads and a total count per industry.
 */
export async function GET() {
    try {
        const supabase = createServerClient();

        // Get all leads with their industry and campaign assignment
        const { data, error } = await supabase
            .from('leads')
            .select('id, industry, campaign_id, full_name, company_name, job_title, email');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const leads = data ?? [];

        // Group by industry
        const industries: Record<string, { total: number; unassigned: number }> = {};
        const unassignedByIndustry: Record<string, typeof leads> = {};

        for (const lead of leads) {
            const ind = lead.industry ?? 'uncategorized';
            if (!industries[ind]) {
                industries[ind] = { total: 0, unassigned: 0 };
                unassignedByIndustry[ind] = [];
            }
            industries[ind].total++;
            if (!lead.campaign_id) {
                industries[ind].unassigned++;
                unassignedByIndustry[ind].push(lead);
            }
        }

        // Sort by unassigned count descending
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
