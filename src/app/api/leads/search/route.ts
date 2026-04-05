import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

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
            query = query.ilike('job_title', `%${jobTitle}%`);
        }
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }
        if (industry) {
            query = query.or(`industry.ilike.%${industry}%,company_name.ilike.%${industry}%,headline.ilike.%${industry}%`);
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
