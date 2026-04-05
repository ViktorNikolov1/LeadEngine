import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const createEmailSchema = z.object({
    lead_id: z.uuid(),
    campaign_id: z.uuid().optional(),
    from_email: z.email(),
    to_email: z.email(),
    subject: z.string().min(1).max(500),
    body_html: z.string().min(1),
    body_text: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let query = supabase
            .from('emails')
            .select('*, lead:leads(id, full_name, email, company_name, job_title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }
        if (search) {
            query = query.or(`subject.ilike.%${search}%,to_email.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching emails:', error);
            return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
        }

        return NextResponse.json({ emails: data ?? [] });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const parsed = createEmailSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Verify the lead belongs to the user
        const { data: lead } = await supabase
            .from('leads')
            .select('id, email')
            .eq('id', parsed.data.lead_id)
            .eq('user_id', user.id)
            .single();

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const { data: email, error } = await supabase
            .from('emails')
            .insert({ ...parsed.data, status: 'draft', user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error('Error creating email:', error);
            return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
        }

        return NextResponse.json({ email }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
