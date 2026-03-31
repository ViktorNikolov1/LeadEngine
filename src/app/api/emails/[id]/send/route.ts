import { NextRequest, NextResponse } from 'next/server';
import { fetchEmailById, updateEmail, insertEmailEvent } from '@/lib/supabase/server';
import { sendEmail, isResendConfigured } from '@/lib/email/resend';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!isResendConfigured()) {
            return NextResponse.json({ error: 'Email service not configured. Set RESEND_API_KEY in environment.' }, { status: 503 });
        }

        const email = await fetchEmailById(id);

        if (!email) {
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
            await updateEmail(id, { status: 'failed' });
            await insertEmailEvent(id, 'send', { error: result.error });
            return NextResponse.json({ error: `Failed to send: ${result.error}` }, { status: 500 });
        }

        // Update email record
        await updateEmail(id, {
            status: 'sent',
            provider_message_id: result.messageId,
            sent_at: new Date().toISOString(),
        });

        // Log send event
        await insertEmailEvent(id, 'send', { messageId: result.messageId });

        // Update lead status to contacted
        const supabase = createServerClient();
        await supabase
            .from('leads')
            .update({ status: 'contacted', updated_at: new Date().toISOString() })
            .eq('id', email.lead_id);

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
