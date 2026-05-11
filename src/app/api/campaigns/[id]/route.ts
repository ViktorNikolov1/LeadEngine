import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const updateCampaignSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    status: z.enum(['active', 'paused', 'completed']).optional(),
    target_leads: z.number().int().min(1).max(1_000_000).nullable().optional(),
    search_criteria: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;
        const body = await request.json();
        const parsed = updateCampaignSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating campaign:', error);
            return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
        }

        return NextResponse.json({ campaign: data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting campaign:', error);
            return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
