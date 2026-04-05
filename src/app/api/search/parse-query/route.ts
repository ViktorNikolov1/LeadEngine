import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { parseSearchQuery } from '@/lib/ai/parseSearchQuery';

const parseQuerySchema = z.object({
    query: z.string().min(5).max(1000),
});

export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const parsed = parseQuerySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Please provide a more detailed search description' }, { status: 400 });
        }

        const filters = await parseSearchQuery(parsed.data.query.trim());

        return NextResponse.json({ filters });
    } catch (err) {
        console.error('Parse query error:', err);
        const message = err instanceof Error ? err.message : 'Failed to parse search query';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
