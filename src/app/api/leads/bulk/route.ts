import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const bulkDeleteSchema = z.object({
    action: z.literal('delete'),
    ids: z.array(z.uuid()).min(1).max(500),
});

const bulkStatusSchema = z.object({
    action: z.literal('status'),
    ids: z.array(z.uuid()).min(1).max(500),
    status: z.enum(['new', 'enriched', 'contacted', 'replied', 'disqualified']),
});

const bulkCampaignSchema = z.object({
    action: z.literal('assign_campaign'),
    ids: z.array(z.uuid()).min(1).max(500),
    campaignId: z.uuid(),
});

const bulkSchema = z.union([bulkDeleteSchema, bulkStatusSchema, bulkCampaignSchema]);

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const parsed = bulkSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { action, ids } = parsed.data;

        if (action === 'delete') {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', ids)
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, affected: ids.length });
        }

        if (action === 'status') {
            const { data, error } = await supabase
                .from('leads')
                .update({ status: parsed.data.status })
                .in('id', ids)
                .eq('user_id', user.id)
                .select();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, affected: data?.length ?? 0, leads: data });
        }

        if (action === 'assign_campaign') {
            const { data, error } = await supabase
                .from('leads')
                .update({ campaign_id: parsed.data.campaignId })
                .in('id', ids)
                .eq('user_id', user.id)
                .select();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, affected: data?.length ?? 0 });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
