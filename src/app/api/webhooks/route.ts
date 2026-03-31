import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, insertEmailEvent } from '@/lib/supabase/server';

type ResendWebhookEvent = {
    type: string;
    data: {
        email_id?: string;
        to?: string[];
        from?: string;
        subject?: string;
        created_at?: string;
        [key: string]: unknown;
    };
};

const EVENT_MAP: Record<string, { eventType: string; timestampField?: string; statusUpdate?: string }> = {
    'email.sent': { eventType: 'send' },
    'email.delivered': { eventType: 'delivery', timestampField: 'delivered_at', statusUpdate: 'delivered' },
    'email.opened': { eventType: 'open', timestampField: 'opened_at' },
    'email.clicked': { eventType: 'click', timestampField: 'clicked_at' },
    'email.bounced': { eventType: 'bounce', statusUpdate: 'bounced' },
    'email.complained': { eventType: 'complaint', statusUpdate: 'complained' },
};

export async function POST(request: NextRequest) {
    try {
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        if (webhookSecret) {
            const svixId = request.headers.get('svix-id');
            const svixTimestamp = request.headers.get('svix-timestamp');
            const svixSignature = request.headers.get('svix-signature');

            if (!svixId || !svixTimestamp || !svixSignature) {
                return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 });
            }
            // TODO: Full signature verification with svix package if needed
        }

        const event = (await request.json()) as ResendWebhookEvent;
        const mapping = EVENT_MAP[event.type];

        if (!mapping) {
            return NextResponse.json({ received: true, ignored: true });
        }

        const providerMessageId = event.data.email_id;
        if (!providerMessageId) {
            return NextResponse.json({ error: 'Missing email_id in event data' }, { status: 400 });
        }

        // Find our email record by provider_message_id
        const supabase = createServerClient();
        const { data: email } = await supabase
            .from('emails')
            .select('id')
            .eq('provider_message_id', providerMessageId)
            .single();

        if (!email) {
            return NextResponse.json({ received: true, matched: false });
        }

        // Insert event
        await insertEmailEvent(email.id, mapping.eventType, event.data as Record<string, unknown>);

        // Update email record
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

        return NextResponse.json({ received: true, processed: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
