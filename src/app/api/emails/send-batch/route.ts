import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { sendEmail, isEmailConfigured } from '@/lib/email/sendgrid';

const schema = z.object({
    email_ids: z.array(z.uuid()).min(1).max(50),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        if (!isEmailConfigured()) {
            return NextResponse.json({ error: 'Email service not configured. Set SENDGRID_API_KEY in environment.' }, { status: 503 });
        }

        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Fetch only approved emails belonging to the user
        const { data: emails } = await supabase
            .from('emails')
            .select('*')
            .in('id', parsed.data.email_ids)
            .eq('user_id', user.id)
            .eq('status', 'approved');

        if (!emails || emails.length === 0) {
            return NextResponse.json({ error: 'No approved emails found to send.' }, { status: 400 });
        }

        const results: { email_id: string; to: string; status: 'sent' | 'failed'; error?: string }[] = [];

        for (const email of emails) {
            const result = await sendEmail({
                to: email.to_email,
                from: email.from_email,
                subject: email.subject,
                html: email.body_html,
                text: email.body_text ?? undefined,
            });

            if (result.success) {
                await supabase.from('emails').update({
                    status: 'sent',
                    provider_message_id: result.messageId,
                    sent_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }).eq('id', email.id);

                await supabase.from('email_events').insert({
                    email_id: email.id,
                    event_type: 'send',
                    event_data: { messageId: result.messageId },
                    user_id: user.id,
                });

                await supabase.from('leads').update({
                    status: 'contacted',
                    updated_at: new Date().toISOString(),
                }).eq('id', email.lead_id).eq('user_id', user.id);

                results.push({ email_id: email.id, to: email.to_email, status: 'sent' });
            } else {
                await supabase.from('emails').update({
                    status: 'failed',
                    updated_at: new Date().toISOString(),
                }).eq('id', email.id);

                await supabase.from('email_events').insert({
                    email_id: email.id,
                    event_type: 'send',
                    event_data: { error: result.error },
                    user_id: user.id,
                });

                results.push({ email_id: email.id, to: email.to_email, status: 'failed', error: result.error });
            }
        }

        const sentCount = results.filter(r => r.status === 'sent').length;
        const failedCount = results.filter(r => r.status === 'failed').length;

        return NextResponse.json({
            message: `Sent ${sentCount} emails, ${failedCount} failed`,
            sent: sentCount,
            failed: failedCount,
            results,
        });
    } catch (err) {
        console.error('Error sending batch emails:', err);
        return NextResponse.json({ error: 'Failed to send batch emails' }, { status: 500 });
    }
}
