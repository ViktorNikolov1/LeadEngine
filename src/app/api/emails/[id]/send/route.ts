import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { sendEmail, isResendConfigured } from '@/lib/email/resend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { id } = await params;

        if (!isResendConfigured()) {
            return NextResponse.json({ error: 'Email service not configured. Set RESEND_API_KEY in environment.' }, { status: 503 });
        }

        // Fetch email ensuring it belongs to the user
        const { data: email, error: fetchErr } = await supabase
            .from('emails')
            .select('*, lead:leads(id, full_name, email, company_name, job_title)')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchErr || !email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        if (email.status !== 'approved') {
            return NextResponse.json(
                { error: `Email must be approved before sending. Current status: ${email.status}` },
                { status: 400 }
            );
        }

        // Send via Resend
        const result = await sendEmail({
            to: email.to_email,
            from: email.from_email,
            subject: email.subject,
            html: email.body_html,
            text: email.body_text ?? undefined,
        });

        if (!result.success) {
            await supabase.from('emails').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id);
            await supabase.from('email_events').insert({ email_id: id, event_type: 'send', event_data: { error: result.error }, user_id: user.id });
            return NextResponse.json({ error: `Failed to send: ${result.error}` }, { status: 500 });
        }

        // Update email record
        await supabase.from('emails').update({
            status: 'sent',
            provider_message_id: result.messageId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', id);

        // Log send event
        await supabase.from('email_events').insert({ email_id: id, event_type: 'send', event_data: { messageId: result.messageId }, user_id: user.id });

        // Update lead status to contacted
        await supabase
            .from('leads')
            .update({ status: 'contacted', updated_at: new Date().toISOString() })
            .eq('id', email.lead_id)
            .eq('user_id', user.id);

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
