export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createSSRClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll() {
                // Read-only in Server Components
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();

    const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
    const email = user?.email ?? '';
    const userId = user?.id ?? '';

    return <SettingsClient displayName={displayName} email={email} userId={userId} />;
}
