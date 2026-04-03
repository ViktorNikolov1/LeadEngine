import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type AddLeadsBody =
    | { mode: 'industry'; industry: string }
    | { mode: 'ids'; leadIds: string[] }
    | { mode: 'unassigned' };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: campaignId } = await params;
        const body = (await request.json()) as AddLeadsBody;
        const supabase = createServerClient();

        // Verify campaign exists
        const { data: campaign, error: campError } = await supabase
            .from('campaigns')
            .select('id')
            .eq('id', campaignId)
            .single();

        if (campError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        let result;

        if (body.mode === 'industry') {
            // Add all leads matching a specific industry
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .ilike('industry', body.industry)
                .is('campaign_id', null)
                .select('id');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        } else if (body.mode === 'ids') {
            // Add specific leads by ID
            if (!body.leadIds || body.leadIds.length === 0) {
                return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
            }

            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .in('id', body.leadIds)
                .select('id');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        } else if (body.mode === 'unassigned') {
            // Add all unassigned leads
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .is('campaign_id', null)
                .select('id');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            result = data;
        } else {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            added: result?.length ?? 0,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
