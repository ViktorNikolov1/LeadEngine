import { NextResponse } from 'next/server';
import { fetchEmailStats } from '@/lib/supabase/server';

export async function GET() {
    try {
        const stats = await fetchEmailStats();
        return NextResponse.json({ stats });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
