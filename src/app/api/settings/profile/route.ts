import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { getAuthenticatedClient } from '@/lib/supabase/auth-api';
import { createClient } from '@supabase/supabase-js';

const updateProfileSchema = z.object({
    full_name: z.string().min(1).max(200),
});

export async function PATCH(request: NextRequest) {
    const auth = await getAuthenticatedClient(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user } = auth;

    try {
        const body = await request.json();
        const parsed = updateProfileSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
        }

        // Use admin client to update user metadata — always use the authenticated user's own ID
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const adminClient = createClient(supabaseUrl, serviceKey);

        const { error } = await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { full_name: parsed.data.full_name },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
