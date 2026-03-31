import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
    try {
        const { userId, full_name } = await request.json();

        if (!userId || !full_name) {
            return NextResponse.json({ error: 'User ID and full name are required' }, { status: 400 });
        }

        const supabase = createServerClient();
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { full_name },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
