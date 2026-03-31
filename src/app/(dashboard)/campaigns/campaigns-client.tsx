'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Clock,
    Users,
    BarChart3,
    X,
    Loader2,
    Trash2,
    Check,
    Pause,
    Play,
    ArrowRight,
    Target,
    Sparkles,
    Filter,
    ArrowUpDown,
    Briefcase,
    Rocket,
    Building,
    ShoppingBag,
    Landmark,
    Layers,
} from 'lucide-react';
import type { Campaign } from '@/types';

type LeadCounts = Record<string, { total: number; byStatus: Record<string, number> }>;

// Icon palette for campaigns (cycles through)
const CAMPAIGN_ICONS = [
    { icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { icon: Landmark, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { icon: Layers, color: 'text-teal-500', bg: 'bg-teal-500/10' },
];

function getCampaignIcon(index: number) {
    return CAMPAIGN_ICONS[index % CAMPAIGN_ICONS.length];
}

export default function CampaignsClient({ campaigns: initial, leadCounts }: { campaigns: Campaign[]; leadCounts: LeadCounts }) {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState(initial);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [creating, setCreating] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const activeCounts = campaigns.filter(c => c.status === 'active').length;
    const pausedCounts = campaigns.filter(c => c.status === 'paused').length;
    const completedCounts = campaigns.filter(c => c.status === 'completed').length;

    const filtered = statusFilter
        ? campaigns.filter(c => c.status === statusFilter)
        : campaigns;

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, target_leads: newTarget ? parseInt(newTarget) : null }),
            });
            if (res.ok) {
                const { campaign } = await res.json();
                setCampaigns(prev => [campaign, ...prev]);
                setNewName('');
                setNewTarget('');
                setShowCreate(false);
            }
        } catch {
            // silent
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (campaign: Campaign) => {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        setTogglingId(campaign.id);
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const { campaign: updated } = await res.json();
                setCampaigns(prev => prev.map(c => c.id === campaign.id ? updated : c));
            }
        } catch {
            // silent
        } finally {
            setTogglingId(null);
        }
    };

    const handleMarkCompleted = async (id: string) => {
        setTogglingId(id);
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            if (res.ok) {
                const { campaign: updated } = await res.json();
                setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
            }
        } catch {
            // silent
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCampaigns(prev => prev.filter(c => c.id !== id));
            }
        } catch {
            // silent
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        Campaign Management
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        Campaigns <Sparkles className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium">Manage your active extractions and track lead generation progress.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="btn-primary shadow-xl shrink-0"
                >
                    <Plus size={16} /> Create New Campaign
                </button>
            </header>

            {/* Status Filter Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card p-2">
                <div className="flex overflow-x-auto gap-2 w-full sm:w-auto px-1">
                    <FilterChip
                        label="All Campaigns"
                        active={!statusFilter}
                        onClick={() => setStatusFilter(null)}
                    />
                    <FilterChip
                        label="Active"
                        count={activeCounts}
                        countColor="bg-emerald-500/10 text-emerald-600"
                        active={statusFilter === 'active'}
                        onClick={() => setStatusFilter(statusFilter === 'active' ? null : 'active')}
                    />
                    <FilterChip
                        label="Paused"
                        count={pausedCounts}
                        countColor="bg-amber-500/10 text-amber-600"
                        active={statusFilter === 'paused'}
                        onClick={() => setStatusFilter(statusFilter === 'paused' ? null : 'paused')}
                    />
                    <FilterChip
                        label="Completed"
                        count={completedCounts}
                        countColor="bg-slate-200 text-slate-600"
                        active={statusFilter === 'completed'}
                        onClick={() => setStatusFilter(statusFilter === 'completed' ? null : 'completed')}
                    />
                </div>
            </div>

            {/* Campaign Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((campaign, index) => {
                    const counts = leadCounts[campaign.id];
                    const scraped = counts?.total ?? 0;
                    const target = campaign.target_leads ?? 0;
                    const progress = target > 0 ? Math.min(Math.round((scraped / target) * 100), 100) : 0;
                    const iconData = getCampaignIcon(index);
                    const IconComponent = iconData.icon;

                    const isActive = campaign.status === 'active';
                    const isPaused = campaign.status === 'paused';
                    const isCompleted = campaign.status === 'completed';

                    const progressColor = isCompleted
                        ? 'bg-slate-400'
                        : isPaused
                            ? 'bg-amber-500'
                            : 'bg-primary-500';

                    const progressTextColor = isCompleted
                        ? 'text-slate-500'
                        : isPaused
                            ? 'text-amber-500'
                            : 'text-primary-600';

                    return (
                        <article
                            key={campaign.id}
                            className={`group flex flex-col card p-6 hover:border-primary-300 transition-all duration-300 animate-in slide-in-from-bottom-4 ${isCompleted ? 'opacity-75 hover:opacity-100' : ''}`}
                            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                        >
                            {/* Header: Icon + Name + Status */}
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${iconData.bg} flex items-center justify-center ${iconData.color} shrink-0`}>
                                        <IconComponent size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-primary-600 transition-colors tracking-tight">
                                            {campaign.name}
                                        </h3>
                                        <p className="text-xs text-secondary-400 mt-1 font-medium flex items-center gap-1">
                                            <Clock size={11} />
                                            {formatDate(campaign.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={campaign.status} />
                            </div>

                            {/* Stats */}
                            <div className="space-y-4 mb-6 flex-1">
                                {/* Leads captured */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black text-slate-900 tracking-tight">{scraped.toLocaleString()}</span>
                                            <span className="text-[10px] text-secondary-400 uppercase font-black tracking-widest">Leads Captured</span>
                                        </div>
                                        {target > 0 && (
                                            <span className={`text-sm font-black ${progressTextColor}`}>{progress}%</span>
                                        )}
                                    </div>
                                    {target > 0 && (
                                        <>
                                            <div className="h-2 w-full bg-secondary-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-out`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-secondary-400 font-medium">
                                                <span>Target: {target.toLocaleString()}</span>
                                                <span>
                                                    {isCompleted
                                                        ? 'Completed'
                                                        : isPaused
                                                            ? 'Paused'
                                                            : `${(target - scraped).toLocaleString()} remaining`}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Status breakdown */}
                                {counts && counts.total > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <MiniStat label="New" value={counts.byStatus.new ?? 0} />
                                        <MiniStat label="Enriched" value={counts.byStatus.enriched ?? 0} />
                                        <MiniStat label="Contacted" value={counts.byStatus.contacted ?? 0} />
                                    </div>
                                )}
                            </div>

                            {/* Footer: Actions */}
                            <div className="pt-4 border-t border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {!isCompleted && (
                                        <button
                                            onClick={() => handleToggleStatus(campaign)}
                                            disabled={togglingId === campaign.id}
                                            className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                                isActive
                                                    ? 'text-secondary-400 hover:text-amber-600 hover:bg-amber-50'
                                                    : 'text-primary-600 hover:bg-primary-50'
                                            }`}
                                            title={isActive ? 'Pause' : 'Resume'}
                                        >
                                            {togglingId === campaign.id ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : isActive ? (
                                                <Pause size={16} />
                                            ) : (
                                                <Play size={16} fill="currentColor" />
                                            )}
                                        </button>
                                    )}
                                    {!isCompleted && (
                                        <button
                                            onClick={() => handleMarkCompleted(campaign.id)}
                                            disabled={togglingId === campaign.id}
                                            className="p-2 rounded-lg text-secondary-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50"
                                            title="Mark Completed"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(campaign.id)}
                                        disabled={deletingId === campaign.id}
                                        className="p-2 rounded-lg text-secondary-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {deletingId === campaign.id ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => router.push(`/leads?campaign=${campaign.id}`)}
                                    className="text-sm font-black text-slate-900 hover:text-primary-600 flex items-center gap-1 transition-colors"
                                >
                                    {isCompleted ? 'View Results' : 'Manage Campaign'}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </article>
                    );
                })}

                {/* Create New Campaign Card */}
                <article
                    onClick={() => setShowCreate(true)}
                    className="group flex flex-col justify-center items-center border-2 border-dashed border-secondary-200 rounded-2xl p-6 min-h-[300px] hover:border-primary-300 hover:bg-primary-50/20 transition-all duration-300 cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full bg-secondary-50 group-hover:bg-primary-100 flex items-center justify-center text-primary-500 mb-4 group-hover:scale-110 transition-all">
                        <Plus size={28} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 text-center tracking-tight">Create New Campaign</h3>
                    <p className="text-sm text-secondary-400 text-center mt-2 max-w-[200px] font-medium">
                        Set up a new extraction target and start generating leads.
                    </p>
                </article>
            </div>

            {/* Create Campaign Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowCreate(false)} />
                    <div className="relative w-full max-w-md card p-8 space-y-6 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">New Campaign</h3>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-secondary-50 rounded-lg transition-colors">
                                <X size={20} className="text-secondary-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">Campaign Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. SaaS Founders EU"
                                    className="input-field"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2 block">Target Leads (optional)</label>
                                <input
                                    type="number"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    placeholder="e.g. 1000"
                                    className="input-field"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-3 bg-white border border-secondary-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-secondary-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newName.trim()}
                                className="flex-1 py-3 btn-primary rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-components ---

function FilterChip({ label, count, countColor, active, onClick }: {
    label: string;
    count?: number;
    countColor?: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center h-9 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                active
                    ? 'bg-secondary-200 text-slate-900'
                    : 'text-secondary-400 hover:bg-secondary-50 hover:text-slate-700'
            }`}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={`ml-2 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-black px-1.5 ${countColor}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'active':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                </span>
            );
        case 'paused':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-100">
                    <Pause size={10} />
                    Paused
                </span>
            );
        case 'completed':
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-1 text-[10px] font-black text-secondary-600 uppercase tracking-widest border border-secondary-200">
                    <Check size={10} />
                    Done
                </span>
            );
        default:
            return null;
    }
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-secondary-50/50 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-secondary-400 uppercase tracking-widest font-bold block">{label}</span>
            <span className="text-sm font-black text-slate-900">{value}</span>
        </div>
    );
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Created just now';
    if (diffHours < 24) return `Created ${diffHours}h ago`;
    if (diffDays < 7) return `Created ${diffDays}d ago`;
    return `Created on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
