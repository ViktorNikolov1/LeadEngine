import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const updateEmailSchema = z.object({
    subject: z.string().min(1).max(500).optional(),
    body_html: z.string().min(1).optional(),
    body_text: z.string().optional(),
    status: z.enum(['draft', 'approved']).optional(),
}).strict();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;
        const { data: email, error } = await supabase
            .from('emails')
            .select('*, lead:leads(id, full_name, email, company_name, job_title)')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        return NextResponse.json({ email });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;
        const body = await request.json();
        const parsed = updateEmailSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const updates: Record<string, unknown> = {
            ...parsed.data,
            updated_at: new Date().toISOString(),
        };

        // If approving, add approved_at timestamp
        if (parsed.data.status === 'approved') {
            updates.approved_at = new Date().toISOString();
        }

        const { data: email, error } = await supabase
            .from('emails')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error || !email) {
            return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
        }

        return NextResponse.json({ email });
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
            .from('emails')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
