'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    BarChart3,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Clock,
    Users,
    Sparkles,
    Activity,
    ArrowUp,
    Database,
    Zap,
    Mail,
    RotateCcw,
} from 'lucide-react';
import type { Run } from '@/types';

type RunWithCampaign = Run & {
    campaign: { id: string; name: string } | null;
};

type RunStats = {
    total24h: number;
    successRate: number;
    active: number;
    failed: number;
};

type Props = {
    runs: RunWithCampaign[];
    stats: RunStats;
};

const PAGE_SIZE = 10;

export default function LogsClient({ runs, stats }: Props) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [selectedRun, setSelectedRun] = useState<RunWithCampaign | null>(null);
    const [page, setPage] = useState(0);

    const filtered = runs.filter(run => {
        const matchesSearch = !searchQuery
            || run.apify_run_id?.toLowerCase().includes(searchQuery.toLowerCase())
            || run.campaign?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            || run.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || run.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const statuses = ['started', 'success', 'failed'];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        System Monitoring
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        Job Logs <Activity className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium">Monitor background processes, lead extractions, and execution history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-secondary-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-secondary-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button
                        onClick={() => router.push('/search')}
                        className="btn-primary shadow-xl"
                    >
                        <Zap size={16} /> New Job
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Jobs (24h)"
                    value={stats.total24h}
                    icon={<BarChart3 size={20} className="text-blue-500" />}
                    delay="0"
                />
                <StatCard
                    label="Success Rate"
                    value={`${stats.successRate}%`}
                    icon={<CheckCircle size={20} className="text-emerald-500" />}
                    delay="100"
                />
                <StatCard
                    label="Active Jobs"
                    value={stats.active}
                    icon={<Loader2 size={20} className="text-primary-500 animate-spin" />}
                    subtitle="Processing"
                    delay="200"
                />
                <StatCard
                    label="Failed Jobs"
                    value={stats.failed}
                    icon={<AlertTriangle size={20} className="text-red-400" />}
                    delay="300"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-xs group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        className="w-full bg-white border border-secondary-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-secondary-300 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm ${statusFilter ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-secondary-200 text-slate-600 hover:bg-secondary-50'} border`}
                    >
                        <Filter size={14} />
                        {statusFilter ?? 'All Statuses'}
                        {statusFilter && (
                            <X size={12} className="text-secondary-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setStatusFilter(null); setShowStatusMenu(false); setPage(0); }} />
                        )}
                    </button>
                    {showStatusMenu && (
                        <div className="absolute top-full mt-2 left-0 bg-white border border-secondary-200 rounded-2xl shadow-2xl z-50 py-2 min-w-[160px]">
                            {statuses.map(s => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setShowStatusMenu(false); setPage(0); }}
                                    className={`w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest hover:bg-secondary-50 transition-colors ${statusFilter === s ? 'text-primary-600 bg-primary-50' : 'text-slate-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                            <hr className="my-1 border-secondary-100" />
                            <button
                                onClick={() => { setStatusFilter(null); setShowStatusMenu(false); setPage(0); }}
                                className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-secondary-400 hover:bg-secondary-50 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs text-secondary-400 font-bold">
                        {filtered.length > 0 ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}` : '0 results'}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="p-2 rounded-xl hover:bg-secondary-50 text-secondary-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-2 rounded-xl hover:bg-secondary-50 text-secondary-400 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table + Detail Panel */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Table */}
                <div className="flex-1 glass-card overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500" />

                    {paginated.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-secondary-100 rounded-[2rem] flex items-center justify-center mb-6">
                                <Activity size={36} className="text-secondary-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No jobs found</h3>
                            <p className="text-secondary-500 max-w-md font-medium">
                                {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'Run a search to create your first job.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-secondary-50/30 border-b border-secondary-200/50 text-secondary-400 text-[9px] uppercase tracking-[0.3em] font-black">
                                    <tr>
                                        <th className="p-5">Job ID</th>
                                        <th className="p-5">Type</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5">Leads</th>
                                        <th className="p-5">Started</th>
                                        <th className="p-5 text-right pr-8">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100/30">
                                    {paginated.map(run => (
                                        <tr
                                            key={run.id}
                                            onClick={() => setSelectedRun(run)}
                                            className={`group hover:bg-white transition-all cursor-pointer border-l-4 ${
                                                run.status === 'started'
                                                    ? 'border-l-primary-500 bg-primary-50/20'
                                                    : run.status === 'failed'
                                                        ? 'border-l-transparent hover:border-l-red-300'
                                                        : 'border-l-transparent hover:border-l-emerald-300'
                                            } ${selectedRun?.id === run.id ? 'bg-white shadow-inner' : ''}`}
                                        >
                                            <td className="p-5">
                                                <span className="text-sm font-black text-slate-900">
                                                    #{run.id.slice(0, 8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-sm text-secondary-500 font-bold">
                                                    <JobTypeIcon campaignName={run.campaign?.name} />
                                                    <span>{run.campaign?.name ?? 'Lead Extraction'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <StatusBadge status={run.status} />
                                            </td>
                                            <td className="p-5">
                                                <span className="text-sm font-black text-slate-900">{run.leads_processed}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-xs font-bold text-secondary-400">
                                                    {formatDateTime(run.created_at)}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right pr-8">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRun(run); }}
                                                    className="p-2.5 bg-secondary-50 text-secondary-400 hover:bg-primary-100 hover:text-primary-600 rounded-xl transition-all"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedRun && (
                    <div className="w-full lg:w-96 shrink-0 card p-0 overflow-hidden self-start lg:sticky lg:top-4 animate-in slide-in-from-right-4 duration-300 shadow-2xl">
                        {/* Panel Header */}
                        <div className="p-5 border-b border-secondary-200/50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-black text-slate-900">
                                        #{selectedRun.id.slice(0, 8).toUpperCase()}
                                    </h3>
                                    {selectedRun.status === 'started' && (
                                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                    )}
                                </div>
                                <p className="text-xs text-secondary-400 font-bold">
                                    {selectedRun.campaign?.name ?? 'Lead Extraction'} &middot; {selectedRun.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRun(null)}
                                className="p-1.5 hover:bg-secondary-50 rounded-lg transition-colors text-secondary-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Progress */}
                        {selectedRun.status === 'started' && (
                            <div className="px-5 py-4 border-b border-secondary-200/50 bg-secondary-50/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Progress</span>
                                    <span className="text-xs font-black text-primary-600">Processing...</span>
                                </div>
                                <div className="w-full bg-secondary-200 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-primary-500 h-1.5 rounded-full animate-pulse" style={{ width: '65%' }} />
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        <div className="p-5 space-y-5">
                            <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Job Details</h4>

                            <div className="space-y-4">
                                <DetailRow label="Job ID" value={selectedRun.id.slice(0, 12)} />
                                <DetailRow label="Apify Run" value={selectedRun.apify_run_id ?? '—'} />
                                <DetailRow label="Status">
                                    <StatusBadge status={selectedRun.status} />
                                </DetailRow>
                                <DetailRow label="Campaign" value={selectedRun.campaign?.name ?? 'None'} />
                                <DetailRow label="Leads Processed" value={String(selectedRun.leads_processed)} />
                                <DetailRow label="Started" value={formatDateTime(selectedRun.created_at)} />
                            </div>

                            {/* Execution Log */}
                            <div className="pt-4 border-t border-secondary-100">
                                <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-4">Execution Log</h4>
                                <div className="relative pl-4 border-l-2 border-secondary-200 space-y-5">
                                    <LogStep
                                        label="Job Initialized"
                                        detail={`Run ID: ${selectedRun.apify_run_id ?? selectedRun.id.slice(0, 8)}`}
                                        time={formatTime(selectedRun.created_at)}
                                        status="done"
                                    />
                                    <LogStep
                                        label="Apify Actor Triggered"
                                        detail="Searching contact database..."
                                        time={formatTime(selectedRun.created_at, 10)}
                                        status="done"
                                    />
                                    {selectedRun.status === 'started' ? (
                                        <>
                                            <LogStep
                                                label="Processing Results"
                                                detail="Waiting for actor completion..."
                                                time="..."
                                                status="active"
                                            />
                                            <LogStep
                                                label="Load into Supabase"
                                                detail=""
                                                time="--:--:--"
                                                status="pending"
                                            />
                                        </>
                                    ) : selectedRun.status === 'success' ? (
                                        <>
                                            <LogStep
                                                label="Results Received"
                                                detail={`${selectedRun.leads_processed} leads found`}
                                                time={formatTime(selectedRun.created_at, 60)}
                                                status="done"
                                                highlight
                                            />
                                            <LogStep
                                                label="Saved to Supabase"
                                                detail={`${selectedRun.leads_processed} records upserted`}
                                                time={formatTime(selectedRun.created_at, 65)}
                                                status="done"
                                            />
                                        </>
                                    ) : (
                                        <LogStep
                                            label="Job Failed"
                                            detail="Check Apify dashboard for error details"
                                            time={formatTime(selectedRun.created_at, 30)}
                                            status="failed"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-secondary-200/50 bg-secondary-50/30 flex gap-3">
                            {selectedRun.status === 'failed' && (
                                <button
                                    onClick={() => router.push('/search')}
                                    className="flex-1 py-2.5 bg-white border border-secondary-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-secondary-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={14} /> Retry
                                </button>
                            )}
                            {selectedRun.status === 'success' && selectedRun.leads_processed > 0 && (
                                <button
                                    onClick={() => router.push('/leads')}
                                    className="flex-1 py-2.5 btn-primary text-xs"
                                >
                                    <Users size={14} /> View Leads
                                </button>
                            )}
                            {selectedRun.status === 'started' && (
                                <span className="flex-1 py-2.5 text-center text-xs font-black text-secondary-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" /> Running...
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Sub-components ---

function StatCard({ label, value, icon, subtitle, delay }: { label: string; value: number | string; icon: React.ReactNode; subtitle?: string; delay: string }) {
    return (
        <div
            className="card p-6 group overflow-hidden relative animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">{label}</span>
                {icon}
            </div>
            <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
                {subtitle && <span className="text-xs font-bold text-secondary-400 mb-1">{subtitle}</span>}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'started':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Running
                </span>
            );
        case 'success':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Completed
                </span>
            );
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">
                    Failed
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary-50 text-secondary-600 border border-secondary-200">
                    {status}
                </span>
            );
    }
}

function JobTypeIcon({ campaignName }: { campaignName?: string }) {
    if (campaignName?.toLowerCase().includes('email')) return <Mail size={16} className="text-indigo-400" />;
    if (campaignName?.toLowerCase().includes('enrich')) return <Sparkles size={16} className="text-purple-400" />;
    if (campaignName?.toLowerCase().includes('sync')) return <RefreshCw size={16} className="text-orange-400" />;
    return <Users size={16} className="text-blue-400" />;
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{label}</span>
            {children ?? <span className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{value}</span>}
        </div>
    );
}

function LogStep({ label, detail, time, status, highlight }: {
    label: string;
    detail: string;
    time: string;
    status: 'done' | 'active' | 'pending' | 'failed';
    highlight?: boolean;
}) {
    const dotColor = {
        done: 'bg-emerald-500',
        active: 'bg-primary-500 animate-pulse',
        pending: 'bg-secondary-300',
        failed: 'bg-red-500',
    }[status];

    return (
        <div className={`relative ${status === 'pending' ? 'opacity-40' : ''}`}>
            <div className={`absolute -left-[13px] top-0.5 h-2.5 w-2.5 rounded-full ${dotColor} border-2 border-white`} />
            <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${status === 'active' ? 'text-primary-600' : status === 'failed' ? 'text-red-600' : 'text-slate-900'}`}>
                        {label}
                    </span>
                    <span className="text-[10px] text-secondary-400 font-mono">{time}</span>
                </div>
                {detail && (
                    <p className={`text-xs ${highlight ? 'text-emerald-600 font-bold' : 'text-secondary-400'}`}>{detail}</p>
                )}
            </div>
        </div>
    );
}

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatTime(dateStr: string, addSeconds = 0): string {
    const d = new Date(new Date(dateStr).getTime() + addSeconds * 1000);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
