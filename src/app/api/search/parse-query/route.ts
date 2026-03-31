import { NextRequest, NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/ai/parseSearchQuery';

export async function POST(request: NextRequest) {
    try {
        const { query } = (await request.json()) as { query?: string };

        if (!query || query.trim().length < 5) {
            return NextResponse.json(
                { error: 'Please provide a more detailed search description' },
                { status: 400 },
            );
        }

        const filters = await parseSearchQuery(query.trim());

        return NextResponse.json({ filters });
    } catch (err) {
        console.error('Parse query error:', err);
        const message = err instanceof Error ? err.message : 'Failed to parse search query';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
