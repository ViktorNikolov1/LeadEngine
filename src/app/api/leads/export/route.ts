import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';

export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { supabase, user } = auth;

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Export failed' }, { status: 500 });
        }

        const leads = data ?? [];
        const headers = ['Full Name', 'Email', 'Job Title', 'Company', 'Location', 'LinkedIn URL', 'Status', 'Created At'];
        const rows = leads.map(l => [
            l.full_name ?? '',
            l.email ?? '',
            l.job_title ?? '',
            l.company_name ?? '',
            l.location ?? '',
            l.linkedin_url ?? '',
            l.status ?? '',
            l.created_at ?? '',
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
