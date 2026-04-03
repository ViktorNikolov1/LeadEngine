export const dynamic = 'force-dynamic';

import { fetchEmails, fetchEmailStats, fetchLeads } from '@/lib/supabase/server';
import { isResendConfigured } from '@/lib/email/resend';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import OutreachClient from './outreach-client';

export default async function OutreachPage() {
    const [emails, stats, allLeads] = await Promise.all([
        fetchEmails(),
        fetchEmailStats(),
        fetchLeads(),
    ]);

    // Only pass minimal lead data needed for the selector
    const leads = allLeads.map(l => ({
        id: l.id,
        full_name: l.full_name,
        email: l.email,
        company_name: l.company_name,
    }));

    return (
        <OutreachClient
            initialEmails={emails}
            initialStats={stats}
            leads={leads}
            resendConfigured={isResendConfigured()}
            geminiConfigured={isGeminiConfigured()}
        />
    );
}
