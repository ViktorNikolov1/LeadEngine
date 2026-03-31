import { notFound } from 'next/navigation';
import { fetchLeadById, fetchEmails } from '@/lib/supabase/server';
import LeadProfile from './lead-profile';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
    const { id } = await params;
    const [lead, emails] = await Promise.all([
        fetchLeadById(id),
        fetchEmails(),
    ]);

    if (!lead) notFound();

    const leadEmails = emails.filter((e: { lead_id?: string }) => e.lead_id === id);

    return <LeadProfile lead={lead} emails={leadEmails} />;
}
