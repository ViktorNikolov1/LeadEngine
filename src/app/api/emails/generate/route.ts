import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { generateOutreachEmail, isGeminiConfigured } from '@/lib/ai/gemini';

const generateSchema = z.object({
    lead_id: z.uuid(),
    sender_name: z.string().min(1),
    sender_company: z.string().min(1),
    context: z.string().optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        if (!isGeminiConfigured()) {
            return NextResponse.json({ error: 'AI service not configured. Set GEMINI_API_KEY in environment.' }, { status: 503 });
        }

        const body = await request.json();
        const parsed = generateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Fetch lead ensuring it belongs to the user
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', parsed.data.lead_id)
            .eq('user_id', user.id)
            .single();

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const result = await generateOutreachEmail({
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
            senderName: parsed.data.sender_name,
            senderCompany: parsed.data.sender_company,
            context: parsed.data.context,
        });

        return NextResponse.json({ generated: result });
    } catch (err) {
        console.error('Error generating email:', err);
        return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
    }
}
