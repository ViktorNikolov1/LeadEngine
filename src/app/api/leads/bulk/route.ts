import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type BulkAction =
    | { action: 'delete'; ids: string[] }
    | { action: 'status'; ids: string[]; status: string };

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as BulkAction;
        const { action, ids } = body;

        if (!ids || ids.length === 0) {
            return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
        }

        if (ids.length > 500) {
            return NextResponse.json({ error: 'Maximum 500 leads per bulk operation' }, { status: 400 });
        }

        const supabase = createServerClient();

        if (action === 'delete') {
            const { error } = await supabase
                .from('leads')
                .delete()
                .in('id', ids);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, affected: ids.length });
        }

        if (action === 'status') {
            const validStatuses = ['new', 'enriched', 'contacted', 'replied', 'disqualified'];
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }

            const { data, error } = await supabase
                .from('leads')
                .update({ status: body.status })
                .in('id', ids)
                .select();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, affected: data?.length ?? 0, leads: data });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
