import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, target_leads, search_criteria } = body;

        if (!name) {
            return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
        }

        const supabase = createServerClient();
        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                name,
                target_leads: target_leads ?? null,
                search_criteria: search_criteria ?? null,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ campaign: data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
