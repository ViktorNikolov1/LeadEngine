import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { generateOutreachEmail, isOpenRouterConfigured } from '@/lib/ai/openrouter';

const schema = z.object({
    campaign_id: z.uuid(),
    sender_name: z.string().min(1),
    sender_company: z.string().min(1),
    from_email: z.email(),
    context: z.string().optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        if (!isOpenRouterConfigured()) {
            return NextResponse.json({ error: 'AI service not configured. Set OPENROUTER_API_KEY in environment.' }, { status: 503 });
        }

        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { campaign_id, sender_name, sender_company, from_email, context } = parsed.data;

        // Verify campaign belongs to user
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('id, name')
            .eq('id', campaign_id)
            .eq('user_id', user.id)
            .single();

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Fetch leads in the campaign that have email and haven't been contacted yet
        const { data: leads } = await supabase
            .from('leads')
            .select('*')
            .eq('campaign_id', campaign_id)
            .eq('user_id', user.id)
            .not('email', 'is', null)
            .in('status', ['new', 'enriched'])
            .order('created_at', { ascending: true });

        if (!leads || leads.length === 0) {
            return NextResponse.json({ error: 'No eligible leads found in this campaign. Leads must have an email and status of "new" or "enriched".' }, { status: 404 });
        }

        // Check which leads already have a draft/approved/sent email to avoid duplicates
        const leadIds = leads.map(l => l.id);
        const { data: existingEmails } = await supabase
            .from('emails')
            .select('lead_id')
            .in('lead_id', leadIds)
            .in('status', ['draft', 'approved', 'sent', 'delivered']);

        const leadsWithEmails = new Set((existingEmails ?? []).map(e => e.lead_id));
        const eligibleLeads = leads.filter(l => !leadsWithEmails.has(l.id));

        if (eligibleLeads.length === 0) {
            return NextResponse.json({ error: 'All leads in this campaign already have emails.' }, { status: 400 });
        }

        // Cap batch size to prevent runaway LLM spend
        const MAX_BATCH_SIZE = 100;
        const batch = eligibleLeads.slice(0, MAX_BATCH_SIZE);

        // Generate emails for each lead (sequential to respect rate limits)
        const results: { lead_id: string; lead_name: string; status: 'success' | 'error'; error?: string }[] = [];

        for (const lead of batch) {
            try {
                const generated = await generateOutreachEmail({
                    lead: {
                        full_name: lead.full_name,
                        first_name: lead.first_name,
                        email: lead.email,
                        company_name: lead.company_name,
                        job_title: lead.job_title,
                        headline: lead.headline,
                        location: lead.location,
                        enrichment_data: lead.enrichment_data,
                    },
                    senderName: sender_name,
                    senderCompany: sender_company,
                    context,
                });

                // Save as draft
                const { error: insertErr } = await supabase.from('emails').insert({
                    lead_id: lead.id,
                    campaign_id,
                    from_email,
                    to_email: lead.email,
                    subject: generated.subject,
                    body_html: generated.bodyHtml,
                    body_text: generated.bodyText,
                    status: 'draft',
                    user_id: user.id,
                });

                if (insertErr) {
                    results.push({ lead_id: lead.id, lead_name: lead.full_name ?? 'Unknown', status: 'error', error: insertErr.message });
                } else {
                    results.push({ lead_id: lead.id, lead_name: lead.full_name ?? 'Unknown', status: 'success' });
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                results.push({ lead_id: lead.id, lead_name: lead.full_name ?? 'Unknown', status: 'error', error: message });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        const cappedMessage = eligibleLeads.length > MAX_BATCH_SIZE
            ? ` (capped at ${MAX_BATCH_SIZE} of ${eligibleLeads.length} eligible)`
            : '';

        return NextResponse.json({
            message: `Generated ${successCount} email drafts for campaign "${campaign.name}"${cappedMessage}`,
            total: batch.length,
            totalEligible: eligibleLeads.length,
            success: successCount,
            errors: errorCount,
            results,
        });
    } catch (err) {
        console.error('Error generating campaign emails:', err);
        return NextResponse.json({ error: 'Failed to generate campaign emails' }, { status: 500 });
    }
}
