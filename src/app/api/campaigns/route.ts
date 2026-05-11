import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

const createCampaignSchema = z.object({
    name: z.string().min(1).max(200),
    target_leads: z.number().int().min(1).max(1_000_000).nullable().optional(),
    search_criteria: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const body = await request.json();
        const parsed = createCampaignSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                name: parsed.data.name,
                target_leads: parsed.data.target_leads ?? null,
                search_criteria: parsed.data.search_criteria ?? null,
                status: 'active',
                user_id: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating campaign:', error);
            return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
        }

        return NextResponse.json({ campaign: data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
