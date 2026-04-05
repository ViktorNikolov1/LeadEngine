import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@supabase/supabase-js';

const resetSchema = z.object({
    email: z.email(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = resetSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // Always return success to prevent email enumeration attacks.
        // The actual email will only be sent if the account exists.
        await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: parsed.data.email,
        });

        return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    } catch {
        // Still return success to prevent enumeration
        return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }
}
