'use client';

import { useState, useCallback, useEffect } from 'react';
import DOMPurify from 'dompurify';
import type { EmailStats, EmailWithLead, Lead } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import {
    Send,
    Mail,
    MailOpen,
    AlertTriangle,
    Search,
    Filter,
    Plus,
    Eye,
    Trash2,
    Loader2,
    X,
    Clock,
    CheckCircle2,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Zap,
    Users,
} from 'lucide-react';

type CampaignOption = {
    id: string;
    name: string;
    status: string;
};

type OutreachClientProps = {
    initialEmails: EmailWithLead[];
    initialStats: EmailStats;
    leads: Pick<Lead, 'id' | 'full_name' | 'email' | 'company_name'>[];
    campaigns: CampaignOption[];
    emailConfigured: boolean;
    aiConfigured: boolean;
};

type ActiveTab = 'compose' | 'campaign' | 'sent' | 'tracking';

type BatchResult = {
    lead_id: string;
    lead_name: string;
    status: 'success' | 'error';
    error?: string;
};

export default function OutreachClient({ initialEmails, initialStats, leads, campaigns, emailConfigured, aiConfigured }: OutreachClientProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('tracking');
    const [emails, setEmails] = useState<EmailWithLead[]>(initialEmails);
    const [stats, setStats] = useState<EmailStats>(initialStats);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');


    // Compose state
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [leadSearch, setLeadSearch] = useState('');
    const [showLeadDropdown, setShowLeadDropdown] = useState(false);
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [senderCompany, setSenderCompany] = useState('');
    const [aiContext, setAiContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
    const [composeStatus, setComposeStatus] = useState<'new' | 'draft' | 'approved'>('new');

    // Campaign batch state
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [campaignSenderName, setCampaignSenderName] = useState('');
    const [campaignSenderCompany, setCampaignSenderCompany] = useState('');
    const [campaignFromEmail, setCampaignFromEmail] = useState('');
    const [campaignContext, setCampaignContext] = useState('');
    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
    const [batchSummary, setBatchSummary] = useState<{ success: number; errors: number; message: string } | null>(null);
    const [isBatchApproving, setIsBatchApproving] = useState(false);
    const [isBatchSending, setIsBatchSending] = useState(false);

    // Detail modal
    const [viewingEmail, setViewingEmail] = useState<EmailWithLead | null>(null);

    // Auto-select lead from URL query param (e.g. ?lead_id=xxx)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('lead_id');
        if (leadId) {
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                setSelectedLeadId(lead.id);
                setLeadSearch(lead.full_name ?? lead.email ?? '');
                setActiveTab('compose');
            }
            // Clean up the URL without reloading
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [leads]);

    const readyToSend = stats.drafts + stats.approved;
    const failed = stats.bounced;
    const deliveryRate = stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0;

    const filteredLeads = leads.filter(l =>
        (l.full_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.email?.toLowerCase().includes(leadSearch.toLowerCase())) && l.email
    );

    const filteredEmails = emails.filter(e => {
        const activeGroup = filterGroups.find(g => g.key === filterStatus);
        const matchesStatus = !activeGroup || activeGroup.statuses.includes(e.status);
        const matchesSearch = !searchQuery ||
            e.lead?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.to_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const filterGroups: { label: string; key: string; statuses: string[]; icon: React.ReactNode }[] = [
        { label: 'Drafted', key: 'drafted', statuses: ['draft', 'approved'], icon: <Clock size={14} /> },
        { label: 'Sent', key: 'sent', statuses: ['sent', 'delivered'], icon: <Send size={14} /> },
        { label: 'Responded', key: 'responded', statuses: ['opened', 'clicked'], icon: <MailOpen size={14} /> },
        { label: 'Opt-out', key: 'optout', statuses: ['complained', 'bounced', 'failed'], icon: <AlertTriangle size={14} /> },
    ];

    const refreshEmails = useCallback(async () => {
        const [emailsRes, statsRes] = await Promise.all([
            fetch('/api/emails'),
            fetch('/api/emails/stats'),
        ]);
        if (emailsRes.ok) {
            const data = await emailsRes.json();
            setEmails(data.emails);
        }
        if (statsRes.ok) {
            const data = await statsRes.json();
            setStats(data.stats);
        }
    }, []);

    const handleSelectLead = (lead: Pick<Lead, 'id' | 'full_name' | 'email' | 'company_name'>) => {
        setSelectedLeadId(lead.id);
        setLeadSearch(lead.full_name ?? lead.email ?? '');
        setShowLeadDropdown(false);
    };

    const handleGenerateAI = async () => {
        if (!selectedLeadId || !senderName || !senderCompany) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/emails/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_id: selectedLeadId,
                    sender_name: senderName,
                    sender_company: senderCompany,
                    context: aiContext || undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSubject(data.generated.subject);
                setBodyHtml(data.generated.bodyHtml);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!selectedLeadId || !fromEmail || !subject || !bodyHtml) return;
        const selectedLead = leads.find(l => l.id === selectedLeadId);
        if (!selectedLead?.email) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_id: selectedLeadId,
                    from_email: fromEmail,
                    to_email: selectedLead.email,
                    subject,
                    body_html: bodyHtml,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setComposeDraftId(data.email.id);
                setComposeStatus('draft');
                await refreshEmails();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleApprove = async () => {
        if (!composeDraftId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/emails/${composeDraftId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            if (res.ok) {
                setComposeStatus('approved');
                await refreshEmails();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSend = async () => {
        if (!composeDraftId) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/emails/${composeDraftId}/send`, { method: 'POST' });
            if (res.ok) {
                // Reset compose form
                resetCompose();
                await refreshEmails();
                setActiveTab('sent');
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteEmail = async (id: string) => {
        const res = await fetch(`/api/emails/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await refreshEmails();
        }
    };

    const handleApproveFromList = async (id: string) => {
        const res = await fetch(`/api/emails/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' }),
        });
        if (res.ok) await refreshEmails();
    };

    const handleSendFromList = async (id: string) => {
        setIsSending(true);
        try {
            const res = await fetch(`/api/emails/${id}/send`, { method: 'POST' });
            if (res.ok) await refreshEmails();
        } finally {
            setIsSending(false);
        }
    };

    const resetCompose = () => {
        setSelectedLeadId('');
        setLeadSearch('');
        setSubject('');
        setBodyHtml('');
        setFromEmail('');
        setAiContext('');
        setComposeDraftId(null);
        setComposeStatus('new');
    };

    // Campaign batch handlers
    const handleBatchGenerate = async () => {
        if (!selectedCampaignId || !campaignSenderName || !campaignSenderCompany || !campaignFromEmail) return;
        setIsBatchGenerating(true);
        setBatchResults(null);
        setBatchSummary(null);
        try {
            const res = await fetch('/api/emails/generate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaign_id: selectedCampaignId,
                    sender_name: campaignSenderName,
                    sender_company: campaignSenderCompany,
                    from_email: campaignFromEmail,
                    context: campaignContext || undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setBatchResults(data.results);
                setBatchSummary({ success: data.success, errors: data.errors, message: data.message });
                await refreshEmails();
            } else {
                setBatchSummary({ success: 0, errors: 0, message: data.error ?? 'Failed to generate emails' });
            }
        } finally {
            setIsBatchGenerating(false);
        }
    };

    const handleBatchApproveAll = async () => {
        // Approve all draft emails for the selected campaign
        const draftEmails = emails.filter(e => e.status === 'draft' && e.campaign_id === selectedCampaignId);
        if (draftEmails.length === 0) return;
        setIsBatchApproving(true);
        try {
            await Promise.all(draftEmails.map(e =>
                fetch(`/api/emails/${e.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'approved' }),
                })
            ));
            await refreshEmails();
        } finally {
            setIsBatchApproving(false);
        }
    };

    const handleBatchSendAll = async () => {
        const approvedEmails = emails.filter(e => e.status === 'approved' && e.campaign_id === selectedCampaignId);
        if (approvedEmails.length === 0) return;
        setIsBatchSending(true);
        try {
            const res = await fetch('/api/emails/send-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_ids: approvedEmails.map(e => e.id) }),
            });
            if (res.ok) {
                await refreshEmails();
            }
        } finally {
            setIsBatchSending(false);
        }
    };

    const campaignDraftCount = selectedCampaignId ? emails.filter(e => e.status === 'draft' && e.campaign_id === selectedCampaignId).length : 0;
    const campaignApprovedCount = selectedCampaignId ? emails.filter(e => e.status === 'approved' && e.campaign_id === selectedCampaignId).length : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        {t('outreach.title')}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        {t('outreach.title')} <Send className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium">{t('outreach.subtitle')}</p>
                </div>
                <div className="flex shrink-0 gap-3">
                    <button
                        onClick={() => { resetCompose(); setActiveTab('compose'); }}
                        className="flex-1 md:flex-none btn-primary shadow-xl"
                    >
                        <Plus size={16} /> Compose Email
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Clock size={20} />} label="Ready to Send" value={readyToSend} color="text-amber-600" bg="bg-amber-100" delay="0" />
                <StatCard icon={<Send size={20} />} label="Sent" value={stats.sent} color="text-blue-600" bg="bg-blue-100" delay="100" />
                <StatCard icon={<CheckCircle2 size={20} />} label="Delivered" value={stats.delivered} subValue={`${deliveryRate}% rate`} color="text-emerald-600" bg="bg-emerald-100" delay="200" />
                <StatCard icon={<AlertTriangle size={20} />} label="Failed" value={failed} color="text-red-600" bg="bg-red-100" delay="300" />
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-secondary-100 p-1.5 rounded-2xl max-w-lg">
                {(['tracking', 'sent', 'compose', 'campaign'] as ActiveTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 text-[11px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-white shadow-lg text-slate-900' : 'text-secondary-400 hover:text-secondary-600'}`}
                    >
                        {tab === 'sent' ? 'Sent' : tab === 'compose' ? 'Compose' : tab === 'campaign' ? 'Campaign' : 'Tracking'}
                    </button>
                ))}
            </div>

            {/* Tracking Tab */}
            {activeTab === 'tracking' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="card p-8 shadow-2xl">
                        <h3 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary-500" /> Outreach Pipeline
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FunnelStep label="Drafted" count={readyToSend} icon={<Clock size={16} />} color="bg-amber-500" />
                            <FunnelStep label="Sent" count={stats.sent} icon={<Send size={16} />} color="bg-blue-500" />
                            <FunnelStep label="Delivered" count={stats.delivered} icon={<CheckCircle2 size={16} />} color="bg-emerald-500" />
                            <FunnelStep label="Failed" count={failed} icon={<AlertTriangle size={16} />} color="bg-red-500" />
                        </div>
                        {stats.sent > 0 && (
                            <div className="mt-6 pt-6 border-t border-secondary-100 flex items-center gap-3">
                                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Delivery Rate</span>
                                <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${deliveryRate}%` }} />
                                </div>
                                <span className="text-sm font-black text-slate-900">{deliveryRate}%</span>
                            </div>
                        )}
                    </div>

                    {stats.total === 0 && (
                        <div className="glass-card flex flex-col items-center justify-center text-center p-16 border-dashed border-2">
                            <div className="w-24 h-24 bg-primary-100 rounded-[2rem] flex items-center justify-center mb-8">
                                <BarChart3 size={40} className="text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">No tracking data yet</h3>
                            <p className="text-secondary-500 max-w-sm mx-auto font-medium leading-relaxed">
                                Start composing and sending emails to track your outreach pipeline here.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Sent Emails Tab */}
            {activeTab === 'sent' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Search & Filter */}
                    <div className="flex flex-col gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-md border border-secondary-200 rounded-3xl py-4 pl-14 pr-4 transition-all focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-slate-900 shadow-sm"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setFilterStatus(null)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${!filterStatus ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-600 border-secondary-200 hover:bg-secondary-50'}`}
                            >
                                <Filter size={14} />
                                All
                            </button>
                            {filterGroups.map(g => {
                                const count = emails.filter(e => g.statuses.includes(e.status)).length;
                                return (
                                    <button
                                        key={g.key}
                                        onClick={() => setFilterStatus(filterStatus === g.key ? null : g.key)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === g.key ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-white text-slate-600 border-secondary-200 hover:bg-secondary-50'}`}
                                    >
                                        {g.icon}
                                        {g.label}
                                        {count > 0 && (
                                            <span className={`ml-0.5 w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-black ${filterStatus === g.key ? 'bg-white/20 text-white' : 'bg-secondary-100 text-secondary-500'}`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Email List */}
                    <div className="glass-card overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500"></div>

                        {filteredEmails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-secondary-100 rounded-[2rem] flex items-center justify-center mb-6">
                                    <Mail size={36} className="text-secondary-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No emails yet</h3>
                                <p className="text-secondary-500 max-w-md font-medium">
                                    Compose and send your first email to start tracking engagement.
                                </p>
                                <button
                                    onClick={() => { resetCompose(); setActiveTab('compose'); }}
                                    className="mt-6 btn-primary"
                                >
                                    <Plus size={16} /> Compose Email
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-secondary-50/30 border-b border-secondary-200/50 text-secondary-400 text-[9px] uppercase tracking-[0.3em] font-black">
                                        <tr>
                                            <th className="p-6 pl-10">Recipient</th>
                                            <th className="p-6">Subject</th>
                                            <th className="p-6">Status</th>
                                            <th className="p-6">Sent</th>
                                            <th className="p-6 text-right pr-10">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100/30">
                                        {filteredEmails.map((email) => (
                                            <tr key={email.id} className="group hover:bg-white transition-all cursor-pointer">
                                                <td className="p-6 pl-10">
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm">{email.lead?.full_name ?? '—'}</p>
                                                        <p className="text-[10px] text-secondary-500 font-bold">{email.to_email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-sm font-bold text-slate-700 truncate max-w-[250px] block">{email.subject}</span>
                                                </td>
                                                <td className="p-6">
                                                    <EmailStatusBadge status={email.status} />
                                                </td>
                                                <td className="p-6 text-sm text-secondary-500">
                                                    {email.sent_at ? new Date(email.sent_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="p-6 text-right pr-10">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewingEmail(email)}
                                                            className="p-2.5 bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {email.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleApproveFromList(email.id)}
                                                                className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                                title="Approve"
                                                            >
                                                                <ShieldCheck size={16} />
                                                            </button>
                                                        )}
                                                        {email.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleSendFromList(email.id)}
                                                                disabled={isSending || !emailConfigured}
                                                                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-40"
                                                                title="Send"
                                                            >
                                                                <Send size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteEmail(email.id)}
                                                            className="p-2.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Compose Tab */}
            {activeTab === 'compose' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="card p-8 shadow-2xl max-w-3xl">
                        <h3 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Mail size={14} className="text-primary-500" /> New Email
                        </h3>

                        <div className="space-y-6">
                            {/* Lead selector */}
                            <div className="group relative">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block group-focus-within:text-primary-600 transition-colors">
                                    To (Lead)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search for a lead by name or email..."
                                    value={leadSearch}
                                    onChange={(e) => { setLeadSearch(e.target.value); setShowLeadDropdown(true); setSelectedLeadId(''); }}
                                    onFocus={() => setShowLeadDropdown(true)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                                {showLeadDropdown && leadSearch && filteredLeads.length > 0 && (
                                    <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-secondary-200 rounded-2xl shadow-2xl z-50 py-2 max-h-60 overflow-y-auto">
                                        {filteredLeads.slice(0, 10).map(lead => (
                                            <button
                                                key={lead.id}
                                                onClick={() => handleSelectLead(lead)}
                                                className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors"
                                            >
                                                <p className="text-sm font-bold text-slate-900">{lead.full_name ?? 'Unknown'}</p>
                                                <p className="text-[10px] text-secondary-500">{lead.email} {lead.company_name ? `· ${lead.company_name}` : ''}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* From email */}
                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block group-focus-within:text-primary-600 transition-colors">
                                    From Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="your@company.com"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>

                            {/* AI Generation Section */}
                            {aiConfigured && (
                                <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/50 rounded-2xl space-y-4">
                                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} /> AI-Powered Generation (OpenRouter)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Your name"
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            className="bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Your company"
                                            value={senderCompany}
                                            onChange={(e) => setSenderCompany(e.target.value)}
                                            className="bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Additional context (optional) — e.g. 'Focus on their recent product launch'"
                                        value={aiContext}
                                        onChange={(e) => setAiContext(e.target.value)}
                                        className="w-full bg-white border border-purple-200 rounded-xl py-2.5 px-3 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold"
                                    />
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={!selectedLeadId || !senderName || !senderCompany || isGenerating}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 size={14} className="animate-spin" /> Generating...</>
                                        ) : (
                                            <><Sparkles size={14} /> Generate Personalized Email</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Subject */}
                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block group-focus-within:text-primary-600 transition-colors">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    placeholder="Email subject line..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>

                            {/* Body */}
                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block group-focus-within:text-primary-600 transition-colors">
                                    Message
                                </label>
                                <textarea
                                    rows={8}
                                    placeholder="Write your personalized outreach message..."
                                    value={bodyHtml}
                                    onChange={(e) => setBodyHtml(e.target.value)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold resize-none"
                                />
                            </div>

                            {/* Service status */}
                            {!emailConfigured && (
                                <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                    <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Email service not connected</p>
                                        <p className="text-xs text-amber-700 font-medium">
                                            Set the SENDGRID_API_KEY environment variable to start sending emails. Drafts can still be saved and approved.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-4 pt-2">
                                {composeStatus === 'new' && (
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={!selectedLeadId || !fromEmail || !subject || !bodyHtml || isSaving}
                                        className="flex-1 py-4 bg-white border border-secondary-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-secondary-50 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                                        Save as Draft
                                    </button>
                                )}
                                {composeStatus === 'draft' && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={isSaving}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-40"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                        Approve Email
                                    </button>
                                )}
                                {composeStatus === 'approved' && (
                                    <button
                                        onClick={handleSend}
                                        disabled={isSending || !emailConfigured}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isSending ? <Loader2 size={14} className="animate-spin" /> : null}
                                        Send Email <Send size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Status indicator */}
                            {composeStatus !== 'new' && (
                                <div className={`text-center text-[10px] font-black uppercase tracking-widest ${composeStatus === 'draft' ? 'text-secondary-400' : 'text-blue-600'}`}>
                                    Status: {composeStatus === 'draft' ? 'Saved as draft — review and approve to send' : 'Approved — ready to send'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Batch Tab */}
            {activeTab === 'campaign' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="card p-8 shadow-2xl max-w-3xl">
                        <h3 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap size={14} className="text-primary-500" /> Campaign Email Generation
                        </h3>
                        <p className="text-sm text-secondary-500 font-medium mb-8">
                            Generate AI-powered personalized emails for all leads in a campaign. Emails are created as drafts for your review before sending.
                        </p>

                        <div className="space-y-6">
                            {/* Campaign selector */}
                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block group-focus-within:text-primary-600 transition-colors">
                                    Campaign
                                </label>
                                <select
                                    value={selectedCampaignId}
                                    onChange={(e) => { setSelectedCampaignId(e.target.value); setBatchResults(null); setBatchSummary(null); }}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                >
                                    <option value="">Select a campaign...</option>
                                    {campaigns.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sender info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={campaignSenderName}
                                        onChange={(e) => setCampaignSenderName(e.target.value)}
                                        className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">Your Company</label>
                                    <input
                                        type="text"
                                        placeholder="Your company"
                                        value={campaignSenderCompany}
                                        onChange={(e) => setCampaignSenderCompany(e.target.value)}
                                        className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">From Email</label>
                                <input
                                    type="email"
                                    placeholder="your@company.com"
                                    value={campaignFromEmail}
                                    onChange={(e) => setCampaignFromEmail(e.target.value)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>

                            <div className="group">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">Context (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 'Mention our new product launch' or 'Focus on cost savings'"
                                    value={campaignContext}
                                    onChange={(e) => setCampaignContext(e.target.value)}
                                    className="w-full bg-secondary-50/50 border border-secondary-200 rounded-2xl py-3 px-4 text-sm text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                                />
                            </div>

                            {!aiConfigured && (
                                <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                    <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">AI service not connected</p>
                                        <p className="text-xs text-amber-700 font-medium">
                                            Set the OPENROUTER_API_KEY environment variable to generate AI-powered emails.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Generate button */}
                            <button
                                onClick={handleBatchGenerate}
                                disabled={!selectedCampaignId || !campaignSenderName || !campaignSenderCompany || !campaignFromEmail || !aiConfigured || isBatchGenerating}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isBatchGenerating ? (
                                    <><Loader2 size={16} className="animate-spin" /> Generating Emails for All Leads...</>
                                ) : (
                                    <><Sparkles size={16} /> Generate Emails for Campaign</>
                                )}
                            </button>

                            {/* Batch results */}
                            {batchSummary && (
                                <div className={`p-5 rounded-2xl border ${batchSummary.errors > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                    <p className={`text-sm font-black ${batchSummary.errors > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                                        {batchSummary.message}
                                    </p>
                                    {batchResults && batchResults.length > 0 && (
                                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                                            {batchResults.map((r, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                    {r.status === 'success' ? (
                                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                                    )}
                                                    <span className="font-bold text-slate-700">{r.lead_name}</span>
                                                    {r.error && <span className="text-red-600">— {r.error}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Batch approve / send actions */}
                            {selectedCampaignId && (campaignDraftCount > 0 || campaignApprovedCount > 0) && (
                                <div className="p-5 bg-secondary-50/50 border border-secondary-200 rounded-2xl space-y-4">
                                    <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={14} /> Campaign Email Actions
                                    </h4>
                                    <div className="flex gap-4">
                                        {campaignDraftCount > 0 && (
                                            <button
                                                onClick={handleBatchApproveAll}
                                                disabled={isBatchApproving}
                                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all disabled:opacity-40"
                                            >
                                                {isBatchApproving ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Approving...</>
                                                ) : (
                                                    <><ShieldCheck size={14} /> Approve All Drafts ({campaignDraftCount})</>
                                                )}
                                            </button>
                                        )}
                                        {campaignApprovedCount > 0 && (
                                            <button
                                                onClick={handleBatchSendAll}
                                                disabled={isBatchSending || !emailConfigured}
                                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all disabled:opacity-40"
                                            >
                                                {isBatchSending ? (
                                                    <><Loader2 size={14} className="animate-spin" /> Sending...</>
                                                ) : (
                                                    <><Send size={14} /> Send All Approved ({campaignApprovedCount})</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {!emailConfigured && campaignApprovedCount > 0 && (
                                        <p className="text-[10px] text-amber-600 font-bold">Set SENDGRID_API_KEY to enable sending.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Email Detail Modal */}
            {viewingEmail && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingEmail(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Email Detail</h3>
                                <button onClick={() => setViewingEmail(null)} className="p-2 hover:bg-secondary-100 rounded-xl transition-colors">
                                    <X size={20} className="text-secondary-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <EmailStatusBadge status={viewingEmail.status} />
                                    <span className="text-[10px] text-secondary-400 font-bold">
                                        {viewingEmail.created_at ? new Date(viewingEmail.created_at).toLocaleString() : ''}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">To</p>
                                        <p className="font-bold text-slate-900">{viewingEmail.lead?.full_name ?? '—'}</p>
                                        <p className="text-secondary-500 text-xs">{viewingEmail.to_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">From</p>
                                        <p className="font-bold text-slate-900">{viewingEmail.from_email}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Subject</p>
                                    <p className="font-bold text-slate-900">{viewingEmail.subject}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">Body</p>
                                    <div className="bg-secondary-50/50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingEmail.body_html) }} />
                                </div>

                                {/* Timeline */}
                                <div>
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-3">Timeline</p>
                                    <div className="space-y-2">
                                        <TimelineItem label="Created" time={viewingEmail.created_at} />
                                        <TimelineItem label="Approved" time={viewingEmail.approved_at} />
                                        <TimelineItem label="Sent" time={viewingEmail.sent_at} />
                                        <TimelineItem label="Delivered" time={viewingEmail.delivered_at} />
                                        <TimelineItem label="Opened" time={viewingEmail.opened_at} />
                                        <TimelineItem label="Clicked" time={viewingEmail.clicked_at} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TimelineItem({ label, time }: { label: string; time: string | null }) {
    if (!time) return null;
    return (
        <div className="flex items-center gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="font-black text-slate-600 uppercase tracking-widest w-20">{label}</span>
            <span className="text-secondary-400">{new Date(time).toLocaleString()}</span>
        </div>
    );
}

function StatCard({ icon, label, value, subValue, color, bg, delay }: { icon: React.ReactNode; label: string; value: number; subValue?: string; color: string; bg: string; delay: string }) {
    return (
        <div
            className="card p-6 hover:shadow-2xl transition-all group overflow-hidden relative cursor-default animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-[1.25rem] flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{label}</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</p>
                    {subValue && <p className="text-[10px] font-bold text-secondary-400">{subValue}</p>}
                </div>
            </div>
        </div>
    );
}

function FunnelStep({ label, count, icon, color }: { label: string; count: number; icon: React.ReactNode; color: string }) {
    return (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary-50/50 border border-secondary-200/50 group hover:bg-white hover:shadow-lg transition-all">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="text-center">
                <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{count}</p>
                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}

function EmailStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        draft: 'bg-secondary-100 text-secondary-600 border-secondary-200',
        approved: 'bg-blue-50 text-blue-700 border-blue-200',
        sent: 'bg-sky-50 text-sky-700 border-sky-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        opened: 'bg-amber-50 text-amber-700 border-amber-200',
        clicked: 'bg-purple-50 text-purple-700 border-purple-200',
        bounced: 'bg-red-50 text-red-700 border-red-200',
        complained: 'bg-red-50 text-red-700 border-red-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border italic ${styles[status] ?? styles.draft}`}>
            {status}
        </span>
    );
}
