'use client';

import { useRouter } from 'next/navigation';
import {
    Users,
    Mail,
    Database,
    TrendingUp,
    ArrowRight,
    Zap,
    Target,
    Sparkles,
    Send,
    Eye,
    Linkedin,
    Award,
    Building,
    MapPin,
    History,
    BarChart3,
    Search,
} from 'lucide-react';
import type { Lead } from '@/types';
import { FunnelChart } from '@/components/ui/FunnelChart';

type DashboardProps = {
    leadStats: Record<string, number>;
    recentLeads: Lead[];
    totalLeads: number;
    emailStats: { total: number; drafts: number; sent: number; delivered: number; opened: number; clicked: number; bounced: number };
    totalCampaigns: number;
};

export default function DashboardClient({ leadStats, recentLeads, totalLeads, emailStats, totalCampaigns }: DashboardProps) {
    const router = useRouter();

    const totalPipeline = Object.values(leadStats).reduce((a, b) => a + b, 0);
    const repliedRate = totalPipeline > 0 ? Math.round(((leadStats.replied ?? 0) / totalPipeline) * 100) : 0;
    const openRate = emailStats.sent > 0 ? Math.round((emailStats.opened / emailStats.sent) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        Command Center
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        Dashboard <Sparkles className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium">Overview of your lead generation engine.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/search')}
                        className="btn-primary shadow-xl"
                    >
                        <Search size={16} /> Find Prospects
                    </button>
                </div>
            </header>

            {/* Top-level KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    label="Total Leads"
                    value={totalLeads}
                    icon={<Users size={20} className="text-blue-500" />}
                    color="from-blue-500/10 to-blue-500/5"
                    delay="0"
                    onClick={() => router.push('/leads')}
                />
                <KpiCard
                    label="Campaigns"
                    value={totalCampaigns}
                    icon={<Database size={20} className="text-purple-500" />}
                    color="from-purple-500/10 to-purple-500/5"
                    delay="100"
                    onClick={() => router.push('/campaigns')}
                />
                <KpiCard
                    label="Emails Sent"
                    value={emailStats.sent}
                    icon={<Send size={20} className="text-emerald-500" />}
                    color="from-emerald-500/10 to-emerald-500/5"
                    delay="200"
                    onClick={() => router.push('/outreach')}
                />
                <KpiCard
                    label="Reply Rate"
                    value={`${repliedRate}%`}
                    icon={<TrendingUp size={20} className="text-amber-500" />}
                    color="from-amber-500/10 to-amber-500/5"
                    delay="300"
                />
            </div>

            {/* Pipeline Conversion Funnel */}
            <div className="w-full">
                <FunnelChart 
                    title="Pipeline Conversion Funnel" 
                    description="Visualize how leads convert through each stage of your outreach process."
                    data={[
                        { id: 'new', label: 'New Leads', value: leadStats.new ?? 0, colorClass: 'bg-blue-500 text-white' },
                        { id: 'enriched', label: 'Enriched', value: leadStats.enriched ?? 0, colorClass: 'bg-slate-500 text-white' },
                        { id: 'contacted', label: 'Contacted', value: leadStats.contacted ?? 0, colorClass: 'bg-amber-500 text-white' },
                        { id: 'replied', label: 'Replied', value: leadStats.replied ?? 0, colorClass: 'bg-purple-500 text-white' },
                    ]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pipeline Breakdown */}
                <div className="lg:col-span-1 card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Target size={16} className="text-primary-500" /> Pipeline
                        </h2>
                        <button
                            onClick={() => router.push('/leads')}
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1"
                        >
                            View All <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <PipelineRow label="New" count={leadStats.new ?? 0} total={totalPipeline} color="bg-blue-500" />
                        <PipelineRow label="Enriched" count={leadStats.enriched ?? 0} total={totalPipeline} color="bg-slate-400" />
                        <PipelineRow label="Contacted" count={leadStats.contacted ?? 0} total={totalPipeline} color="bg-amber-500" />
                        <PipelineRow label="Replied" count={leadStats.replied ?? 0} total={totalPipeline} color="bg-purple-500" />
                        <PipelineRow label="Disqualified" count={leadStats.disqualified ?? 0} total={totalPipeline} color="bg-red-400" />
                    </div>
                </div>

                {/* Email Stats */}
                <div className="lg:col-span-1 card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={16} className="text-emerald-500" /> Outreach
                        </h2>
                        <button
                            onClick={() => router.push('/outreach')}
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1"
                        >
                            View All <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatBlock label="Total" value={emailStats.total} />
                        <StatBlock label="Drafts" value={emailStats.drafts} />
                        <StatBlock label="Sent" value={emailStats.sent} />
                        <StatBlock label="Delivered" value={emailStats.delivered} />
                        <StatBlock label="Opened" value={emailStats.opened} highlight />
                        <StatBlock label="Clicked" value={emailStats.clicked} highlight />
                    </div>
                    {emailStats.sent > 0 && (
                        <div className="pt-4 border-t border-secondary-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Open Rate</span>
                            <span className="text-lg font-black text-slate-900">{openRate}%</span>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1 card p-8 space-y-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" /> Quick Actions
                    </h2>
                    <div className="space-y-3">
                        <QuickAction
                            label="Find New Prospects"
                            description="Search for leads using Apify filters"
                            icon={<Search size={18} className="text-primary-600" />}
                            onClick={() => router.push('/search')}
                        />
                        <QuickAction
                            label="View Lead Pipeline"
                            description="Manage and nurture your leads"
                            icon={<Users size={18} className="text-blue-600" />}
                            onClick={() => router.push('/leads')}
                        />
                        <QuickAction
                            label="Create Campaign"
                            description="Organize leads into campaigns"
                            icon={<Database size={18} className="text-purple-600" />}
                            onClick={() => router.push('/campaigns')}
                        />
                        <QuickAction
                            label="Email Outreach"
                            description="Draft and send personalized emails"
                            icon={<Send size={18} className="text-emerald-600" />}
                            onClick={() => router.push('/outreach')}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Leads */}
            {recentLeads.length > 0 && (
                <div className="card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 size={16} className="text-blue-500" /> Recent Leads
                        </h2>
                        <button
                            onClick={() => router.push('/leads')}
                            className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 flex items-center gap-1"
                        >
                            View Pipeline <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-secondary-400 text-[9px] uppercase tracking-[0.3em] font-black border-b border-secondary-100">
                                <tr>
                                    <th className="pb-3 pr-6">Name</th>
                                    <th className="pb-3 pr-6">Title</th>
                                    <th className="pb-3 pr-6">Company</th>
                                    <th className="pb-3 pr-6">Status</th>
                                    <th className="pb-3 text-right">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100/50">
                                {recentLeads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => router.push('/leads')}
                                        className="hover:bg-secondary-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="py-4 pr-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-200 text-secondary-700 flex items-center justify-center text-sm font-black">
                                                    {(lead.full_name ?? lead.first_name ?? '?').charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors">
                                                    {lead.full_name ?? (`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || 'Unknown')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 pr-6">
                                            <span className="text-xs font-bold text-secondary-500">{lead.job_title ?? '—'}</span>
                                        </td>
                                        <td className="py-4 pr-6">
                                            <span className="text-xs font-bold text-slate-700">{lead.company_name ?? '—'}</span>
                                        </td>
                                        <td className="py-4 pr-6">
                                            <StageBadge stage={lead.status} />
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                                                {formatRelativeTime(lead.created_at)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function KpiCard({ label, value, icon, color, delay, onClick }: { label: string; value: number | string; icon: React.ReactNode; color: string; delay: string; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`card p-6 group overflow-hidden relative animate-in slide-in-from-bottom-4 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">{label}</span>
                    {icon}
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
            </div>
            {onClick && (
                <ArrowRight size={14} className="absolute bottom-4 right-4 text-secondary-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            )}
        </div>
    );
}

function PipelineRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{label}</span>
                <span className="text-xs font-black text-slate-900">{count}</span>
            </div>
            <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function StatBlock({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={`p-3 rounded-xl border ${highlight ? 'bg-emerald-50/50 border-emerald-100' : 'bg-secondary-50/50 border-secondary-100'}`}>
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-1">{label}</span>
            <span className={`text-xl font-black ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</span>
        </div>
    );
}

function QuickAction({ label, description, icon, onClick }: { label: string; description: string; icon: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-secondary-200/50 hover:border-primary-200 hover:bg-primary-50/30 transition-all group text-left"
        >
            <div className="w-10 h-10 rounded-xl bg-secondary-50 group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest block">{label}</span>
                <span className="text-[10px] text-secondary-400 font-medium">{description}</span>
            </div>
            <ArrowRight size={14} className="text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />
        </button>
    );
}

function StageBadge({ stage }: { stage: string }) {
    let styles = "bg-secondary-100/50 text-secondary-700 border-secondary-200/50";
    switch (stage) {
        case 'new': styles = "bg-blue-50 text-blue-700 border-blue-200"; break;
        case 'enriched': styles = "bg-slate-50 text-slate-600 border-slate-200"; break;
        case 'contacted': styles = "bg-amber-50 text-amber-700 border-amber-200"; break;
        case 'replied': styles = "bg-purple-50 text-purple-700 border-purple-200"; break;
        case 'disqualified': styles = "bg-red-50 text-red-700 border-red-200"; break;
    }
    return (
        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles}`}>
            {stage}
        </span>
    );
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
