import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobTitle = searchParams.get('jobTitle');
    const location = searchParams.get('location');
    const industry = searchParams.get('industry');

    try {
        const supabase = createServerClient();
        let query = supabase.from('leads').select('*');

        if (jobTitle) {
            query = query.ilike('job_title', `%${jobTitle}%`);
        }
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }
        if (industry) {
            query = query.or(`company_name.ilike.%${industry}%,headline.ilike.%${industry}%`);
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
