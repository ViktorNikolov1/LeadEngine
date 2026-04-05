import { type NextRequest } from 'next/server';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';

type AuthSuccess = { ok: true; supabase: SupabaseClient; user: User };
type AuthFailure = { ok: false; error: string; status: number };
type AuthResult = AuthSuccess | AuthFailure;

/**
 * Verify the user is authenticated via session cookies and return a
 * service-role Supabase client scoped to the verified user.
 *
 * Usage in API routes:
 *   const auth = await getAuthenticatedClient(request);
 *   if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   const { supabase, user } = auth;
 */
export async function getAuthenticatedClient(request: NextRequest): Promise<AuthResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
        return { ok: false, error: 'Server configuration error', status: 500 };
    }

    // Use the anon key with cookies to verify the user's session
    const anonClient = createSSRClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll() {
                // API routes: session refresh happens in middleware, not here
            },
        },
    });

    const { data: { user }, error } = await anonClient.auth.getUser();

    if (error || !user) {
        return { ok: false, error: 'Unauthorized', status: 401 };
    }

    // Return a service-role client for DB operations
    // (service role bypasses RLS, but we manually filter by user_id)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    return { ok: true, supabase, user };
}
