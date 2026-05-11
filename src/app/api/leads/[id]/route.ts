import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const updateLeadSchema = z.object({
    first_name: z.string().max(200).optional(),
    last_name: z.string().max(200).optional(),
    full_name: z.string().max(400).optional(),
    email: z.email().optional(),
    headline: z.string().max(500).optional(),
    location: z.string().max(300).optional(),
    company_name: z.string().max(300).optional(),
    company_domain: z.string().max(300).optional(),
    job_title: z.string().max(300).optional(),
    industry: z.string().max(200).optional(),
    status: z.enum(['new', 'enriched', 'contacted', 'replied', 'disqualified']).optional(),
    campaign_id: z.uuid().nullable().optional(),
}).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;
        const body = await request.json();
        const parsed = updateLeadSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('leads')
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead:', error);
            return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
        }

        return NextResponse.json({ lead: data });
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
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting lead:', error);
            return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
