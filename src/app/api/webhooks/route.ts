import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient, insertEmailEvent } from '@/lib/supabase/server';

type SendGridEvent = {
    event: string;
    sg_message_id?: string;
    email?: string;
    timestamp?: number;
    [key: string]: unknown;
};

const EVENT_MAP: Record<string, { eventType: string; timestampField?: string; statusUpdate?: string }> = {
    'processed': { eventType: 'send' },
    'delivered': { eventType: 'delivery', timestampField: 'delivered_at', statusUpdate: 'delivered' },
    'open': { eventType: 'open', timestampField: 'opened_at' },
    'click': { eventType: 'click', timestampField: 'clicked_at' },
    'bounce': { eventType: 'bounce', statusUpdate: 'bounced' },
    'dropped': { eventType: 'bounce', statusUpdate: 'failed' },
    'spamreport': { eventType: 'complaint', statusUpdate: 'complained' },
};

function verifyWebhookSignature(publicKey: string, payload: string, signature: string, timestamp: string): boolean {
    try {
        const timestampPayload = timestamp + payload;
        const decodedKey = crypto.createPublicKey({
            key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
            format: 'pem',
        });
        return crypto.verify(
            'sha256',
            Buffer.from(timestampPayload),
            decodedKey,
            Buffer.from(signature, 'base64'),
        );
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const webhookVerificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
        if (!webhookVerificationKey) {
            console.error('SENDGRID_WEBHOOK_VERIFICATION_KEY is not configured — rejecting webhook');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
        }

        const signature = request.headers.get('x-twilio-email-event-webhook-signature');
        const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');

        if (!signature || !timestamp) {
            return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 });
        }

        const body = await request.text();

        if (!verifyWebhookSignature(webhookVerificationKey, body, signature, timestamp)) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        const events: SendGridEvent[] = JSON.parse(body);

        if (!Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
        }

        const supabase = createServerClient();
        let processed = 0;

        for (const evt of events) {
            const mapping = EVENT_MAP[evt.event];
            if (!mapping) continue;

            // SendGrid message IDs have a format like "abc123.filter0001.12345.abc-1"
            // The provider_message_id stored is the base part before the first "."
            const rawId = evt.sg_message_id;
            if (!rawId) continue;
            const baseMessageId = rawId.split('.')[0];

            const { data: email } = await supabase
                .from('emails')
                .select('id')
                .eq('provider_message_id', baseMessageId)
                .single();

            if (!email) continue;

            await insertEmailEvent(email.id, mapping.eventType, evt as Record<string, unknown>);

            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

            if (mapping.statusUpdate) {
                updates.status = mapping.statusUpdate;
            }
            if (mapping.timestampField) {
                updates[mapping.timestampField] = new Date().toISOString();
            }

            await supabase
                .from('emails')
                .update(updates)
                .eq('id', email.id);

            processed++;
        }

        return NextResponse.json({ received: true, processed });
    } catch (err) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
