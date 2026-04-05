import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import type { EmailStatus } from '@/types';

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { data, error } = await supabase
            .from('emails')
            .select('status, opened_at, clicked_at')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching email stats:', error);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        const stats = { total: 0, drafts: 0, approved: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };

        for (const email of data ?? []) {
            stats.total++;
            switch (email.status as EmailStatus) {
                case 'draft': stats.drafts++; break;
                case 'approved': stats.approved++; break;
                case 'sent': stats.sent++; break;
                case 'delivered': stats.delivered++; break;
                case 'bounced': stats.bounced++; break;
                case 'complained': stats.bounced++; break;
                case 'failed': break;
            }
            if (email.opened_at) stats.opened++;
            if (email.clicked_at) stats.clicked++;
        }

        return NextResponse.json({ stats });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
