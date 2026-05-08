import { notFound } from 'next/navigation';
import { getServerUserId, fetchLeadById, fetchEmails } from '@/lib/supabase/server';
import LeadProfile from './lead-profile';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
    const { id } = await params;
    const userId = await getServerUserId();
    const [lead, emails] = await Promise.all([
        fetchLeadById(id, userId),
        fetchEmails(userId),
    ]);

    if (!lead) notFound();

    const leadEmails = emails.filter((e: { lead_id?: string }) => e.lead_id === id);

    return <LeadProfile lead={lead} emails={leadEmails} />;
}
