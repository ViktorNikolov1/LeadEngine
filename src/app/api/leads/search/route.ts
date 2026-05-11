import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

/** Escape characters that have special meaning in PostgREST filter syntax */
function sanitizeFilterValue(value: string): string {
    return value.replace(/[%_.,()\\]/g, '');
}

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    const { searchParams } = new URL(request.url);
    const jobTitle = searchParams.get('jobTitle');
    const location = searchParams.get('location');
    const industry = searchParams.get('industry');

    try {
        let query = supabase.from('leads').select('*').eq('user_id', user.id);

        if (jobTitle) {
            const safe = sanitizeFilterValue(jobTitle);
            query = query.ilike('job_title', `%${safe}%`);
        }
        if (location) {
            const safe = sanitizeFilterValue(location);
            query = query.ilike('location', `%${safe}%`);
        }
        if (industry) {
            const safe = sanitizeFilterValue(industry);
            query = query.or(`industry.ilike.%${safe}%,company_name.ilike.%${safe}%,headline.ilike.%${safe}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

        if (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Search failed' }, { status: 500 });
        }

        return NextResponse.json({ leads: data ?? [] });
    } catch (err) {
        console.error('Search error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
