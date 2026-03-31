import { createServerClient } from '@/lib/supabase/server';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
    const supabase = createServerClient();
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1 });

    const user = users?.[0] ?? null;
    const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
    const email = user?.email ?? '';
    const userId = user?.id ?? '';

    return <SettingsClient displayName={displayName} email={email} userId={userId} />;
}
