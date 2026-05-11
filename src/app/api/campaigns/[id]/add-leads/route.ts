import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const addByIndustrySchema = z.object({ mode: z.literal('industry'), industry: z.string().min(1) });
const addByIdsSchema = z.object({ mode: z.literal('ids'), leadIds: z.array(z.uuid()).min(1).max(500) });
const addUnassignedSchema = z.object({ mode: z.literal('unassigned') });
const addLeadsSchema = z.union([addByIndustrySchema, addByIdsSchema, addUnassignedSchema]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id: campaignId } = await params;
        const body = await request.json();
        const parsed = addLeadsSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Verify campaign belongs to user
        const { data: campaign, error: campError } = await supabase
            .from('campaigns')
            .select('id')
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .single();

        if (campError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        let result;

        if (parsed.data.mode === 'industry') {
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .ilike('industry', parsed.data.industry)
                .is('campaign_id', null)
                .eq('user_id', user.id)
                .select('id');

            if (error) {
                console.error('Error adding leads to campaign:', error);
                return NextResponse.json({ error: 'Failed to add leads to campaign' }, { status: 500 });
            }
            result = data;
        } else if (parsed.data.mode === 'ids') {
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .in('id', parsed.data.leadIds)
                .eq('user_id', user.id)
                .select('id');

            if (error) {
                console.error('Error adding leads to campaign:', error);
                return NextResponse.json({ error: 'Failed to add leads to campaign' }, { status: 500 });
            }
            result = data;
        } else {
            // unassigned
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: campaignId })
                .is('campaign_id', null)
                .eq('user_id', user.id)
                .select('id');

            if (error) {
                console.error('Error adding leads to campaign:', error);
                return NextResponse.json({ error: 'Failed to add leads to campaign' }, { status: 500 });
            }
            result = data;
        }

        return NextResponse.json({
            success: true,
            added: result?.length ?? 0,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
