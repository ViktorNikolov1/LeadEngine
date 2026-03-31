import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createServerClient, fetchEmails, createEmail } from '@/lib/supabase/server';

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
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') ?? undefined;
        const search = searchParams.get('search') ?? undefined;

        const emails = await fetchEmails({ status, search });
        return NextResponse.json({ emails });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = createEmailSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Verify the lead exists and has an email
        const supabase = createServerClient();
        const { data: lead } = await supabase
            .from('leads')
            .select('id, email')
            .eq('id', parsed.data.lead_id)
            .single();

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const email = await createEmail(parsed.data);

        if (!email) {
            return NextResponse.json({ error: 'Failed to create email' }, { status: 500 });
        }

        return NextResponse.json({ email }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
