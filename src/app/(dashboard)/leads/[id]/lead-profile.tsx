'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Linkedin,
    Mail,
    MapPin,
    Building,
    Briefcase,
    Calendar,
    Copy,
    Check,
    Send,
    ExternalLink,
    Globe,
    Shield,
    Clock,
    Activity,
    FileText,
    Tag,
    ChevronRight,
    Loader2,
    Trash2,
} from 'lucide-react';
import type { Lead } from '@/types';

type LeadEmail = {
    id: string;
    subject: string;
    status: string;
    created_at: string;
    sent_at: string | null;
    opened_at: string | null;
};

type LeadProfileProps = {
    lead: Lead;
    emails: LeadEmail[];
};

export default function LeadProfile({ lead: initialLead, emails }: LeadProfileProps) {
    const router = useRouter();
    const [lead, setLead] = useState(initialLead);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedLinkedin, setCopiedLinkedin] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const displayName = lead.full_name ?? (`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || 'Unknown');
    const initials = displayName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
    const enrichment = lead.enrichment_data as Record<string, unknown> | null;

    const handleCopyEmail = async () => {
        if (!lead.email) return;
        await navigator.clipboard.writeText(lead.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    const handleCopyLinkedin = async () => {
        if (!lead.linkedin_url) return;
        await navigator.clipboard.writeText(lead.linkedin_url);
        setCopiedLinkedin(true);
        setTimeout(() => setCopiedLinkedin(false), 2000);
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const { lead: updated } = await res.json();
                setLead(updated);
            }
        } catch {
            // silent
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/leads');
            }
        } catch {
            // silent
        } finally {
            setDeleting(false);
        }
    };

    const statuses = ['new', 'enriched', 'contacted', 'replied', 'disqualified'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <button
                    onClick={() => router.push('/leads')}
                    className="flex items-center gap-2 text-secondary-400 hover:text-primary-600 transition-colors font-bold"
                >
                    <ArrowLeft size={16} /> Leads
                </button>
                <ChevronRight size={14} className="text-secondary-300" />
                <span className="text-slate-900 font-black">{displayName}</span>
            </div>

            {/* Profile Header */}
            <div className="card p-8 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500" />
                <div className="flex flex-col md:flex-row items-start gap-8">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center text-3xl font-black shadow-xl shrink-0">
                        {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{displayName}</h1>
                            <p className="text-secondary-500 font-bold mt-1">
                                {lead.job_title ?? lead.headline ?? '—'}
                                {lead.company_name && <span className="text-slate-700"> at {lead.company_name}</span>}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {lead.location && (
                                <InfoBadge icon={<MapPin size={12} />} text={lead.location} />
                            )}
                            {lead.company_name && (
                                <InfoBadge icon={<Building size={12} />} text={lead.company_name} />
                            )}
                            {lead.source && (
                                <InfoBadge icon={<Globe size={12} />} text={lead.source} />
                            )}
                            {lead.industry && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-700 border border-primary-200/50 text-[10px] font-black uppercase tracking-widest">
                                    {lead.industry.split(/[\s/]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </span>
                            )}
                            <StageBadge stage={lead.status} />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                        {lead.linkedin_url && (
                            <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-[#0077b5] text-white rounded-2xl hover:bg-[#006097] transition-all shadow-lg"
                                title="View LinkedIn"
                            >
                                <Linkedin size={20} />
                            </a>
                        )}
                        {lead.email && (
                            <button
                                onClick={() => router.push(`/outreach?lead_id=${lead.id}`)}
                                className="btn-primary shadow-xl"
                            >
                                <Send size={16} /> Send Email
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column — main content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About / Headline */}
                    {(lead.headline || Boolean(enrichment?.summary) || Boolean(enrichment?.about)) && (
                        <div className="card p-8 space-y-4">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16} className="text-primary-500" /> About
                            </h2>
                            <p className="text-sm text-secondary-600 leading-relaxed font-medium">
                                {String(enrichment?.summary ?? enrichment?.about ?? lead.headline ?? '—')}
                            </p>
                        </div>
                    )}

                    {/* Enrichment Data */}
                    {enrichment && Object.keys(enrichment).length > 0 && (
                        <div className="card p-8 space-y-4">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={16} className="text-purple-500" /> Enrichment Data
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(enrichment)
                                    .filter(([key]) => !['summary', 'about'].includes(key))
                                    .map(([key, value]) => (
                                        <div key={key} className="p-3 rounded-xl bg-secondary-50/50 border border-secondary-100">
                                            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-1">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 break-words">
                                                {formatEnrichmentValue(value)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Activity / Email History */}
                    <div className="card p-8 space-y-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" /> Activity
                        </h2>
                        {emails.length === 0 ? (
                            <p className="text-sm text-secondary-400 font-medium">No outreach activity yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {emails.map(email => (
                                    <div
                                        key={email.id}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-secondary-100 hover:border-primary-200 hover:bg-primary-50/20 transition-all cursor-pointer group"
                                        onClick={() => router.push(`/outreach`)}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                            <Mail size={18} className="text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-black text-slate-900 block truncate">{email.subject}</span>
                                            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                                {email.status} · {formatRelativeTime(email.created_at)}
                                            </span>
                                        </div>
                                        <EmailStatusDot status={email.status} opened={!!email.opened_at} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="card p-8 space-y-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} className="text-amber-500" /> Notes
                        </h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this lead..."
                            rows={4}
                            className="input-field resize-none"
                        />
                    </div>
                </div>

                {/* Right column — sidebar */}
                <div className="space-y-8">
                    {/* Traceability */}
                    <div className="card p-8 space-y-5">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-blue-500" /> Traceability
                        </h2>
                        <div className="space-y-4">
                            <TraceRow label="Status">
                                <StageBadge stage={lead.status} />
                            </TraceRow>
                            <TraceRow label="Captured">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar size={14} className="text-secondary-400" />
                                    {new Date(lead.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </TraceRow>
                            <TraceRow label="Last Updated">
                                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Clock size={14} className="text-secondary-400" />
                                    {formatRelativeTime(lead.updated_at)}
                                </span>
                            </TraceRow>
                            <TraceRow label="Source">
                                <span className="text-sm font-bold text-slate-900">{lead.source ?? 'Unknown'}</span>
                            </TraceRow>
                            {lead.campaign_id && (
                                <TraceRow label="Campaign">
                                    <button
                                        onClick={() => router.push('/campaigns')}
                                        className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1"
                                    >
                                        View <ExternalLink size={12} />
                                    </button>
                                </TraceRow>
                            )}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="card p-8 space-y-5">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={16} className="text-primary-500" /> Contact Info
                        </h2>
                        <div className="space-y-4">
                            {lead.email && (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary-50/50 border border-secondary-100">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-0.5">Email</span>
                                        <span className="text-sm font-bold text-slate-900 truncate block">{lead.email}</span>
                                    </div>
                                    <button
                                        onClick={handleCopyEmail}
                                        className="p-2 hover:bg-white rounded-lg transition-colors shrink-0"
                                        title="Copy email"
                                    >
                                        {copiedEmail ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-secondary-400" />}
                                    </button>
                                </div>
                            )}
                            {lead.linkedin_url && (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary-50/50 border border-secondary-100">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-0.5">LinkedIn</span>
                                        <span className="text-sm font-bold text-[#0077b5] truncate block">{lead.linkedin_url}</span>
                                    </div>
                                    <button
                                        onClick={handleCopyLinkedin}
                                        className="p-2 hover:bg-white rounded-lg transition-colors shrink-0"
                                        title="Copy LinkedIn URL"
                                    >
                                        {copiedLinkedin ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-secondary-400" />}
                                    </button>
                                </div>
                            )}
                            {lead.company_domain && (
                                <div className="p-3 rounded-xl bg-secondary-50/50 border border-secondary-100">
                                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-0.5">Company Domain</span>
                                    <a
                                        href={`https://${lead.company_domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1"
                                    >
                                        {lead.company_domain} <ExternalLink size={12} />
                                    </a>
                                </div>
                            )}
                            {!lead.email && !lead.linkedin_url && (
                                <p className="text-sm text-secondary-400 font-medium">No contact info available.</p>
                            )}
                        </div>
                    </div>

                    {/* Status Change */}
                    <div className="card p-8 space-y-5">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Briefcase size={16} className="text-amber-500" /> Actions
                        </h2>
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block">Change Status</span>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${lead.status === s
                                            ? 'bg-primary-100 text-primary-700 border-primary-200'
                                            : 'bg-white text-slate-600 border-secondary-200 hover:bg-secondary-50'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <hr className="border-secondary-100" />
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full py-3 bg-white border border-red-200 rounded-2xl text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                            Delete Lead
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

function InfoBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50/50 border border-secondary-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary-500">
            {icon} {text}
        </div>
    );
}

function StageBadge({ stage }: { stage: string }) {
    let styles = 'bg-secondary-100/50 text-secondary-700 border-secondary-200/50';
    switch (stage) {
        case 'new': styles = 'bg-blue-50 text-blue-700 border-blue-200'; break;
        case 'enriched': styles = 'bg-slate-50 text-slate-600 border-slate-200'; break;
        case 'contacted': styles = 'bg-amber-50 text-amber-700 border-amber-200'; break;
        case 'replied': styles = 'bg-purple-50 text-purple-700 border-purple-200'; break;
        case 'disqualified': styles = 'bg-red-50 text-red-700 border-red-200'; break;
    }
    return (
        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles}`}>
            {stage}
        </span>
    );
}

function TraceRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{label}</span>
            {children}
        </div>
    );
}

function EmailStatusDot({ status, opened }: { status: string; opened: boolean }) {
    if (opened) return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Opened" />;
    if (status === 'sent' || status === 'delivered') return <div className="w-2.5 h-2.5 rounded-full bg-blue-500" title={status} />;
    if (status === 'draft') return <div className="w-2.5 h-2.5 rounded-full bg-secondary-300" title="Draft" />;
    if (status === 'bounced') return <div className="w-2.5 h-2.5 rounded-full bg-red-500" title="Bounced" />;
    return <div className="w-2.5 h-2.5 rounded-full bg-secondary-200" title={status} />;
}

function formatEnrichmentValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
