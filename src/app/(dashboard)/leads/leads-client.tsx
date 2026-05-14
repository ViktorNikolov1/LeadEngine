'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    Target,
    History,
    Mail,
    Linkedin,
    Eye,
    X,
    Send,
    Activity,
    Calendar,
    Download,
    Trash2,
    Loader2,
    CheckSquare,
    Square,
    MinusSquare,
} from 'lucide-react';
import type { Lead, Campaign } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';

type LeadStats = Record<string, number>;

export default function LeadsClient({ leads: initialLeads, stats, campaigns }: { leads: Lead[]; stats: LeadStats; campaigns: Campaign[] }) {
    const router = useRouter();
    const { t } = useLanguage();
    const [leads, setLeads] = useState(initialLeads);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [showCampaignMenu, setShowCampaignMenu] = useState(false);

    const handleAssignToCampaign = async (campaignId: string) => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);
        setShowCampaignMenu(false);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/add-leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'ids', leadIds: Array.from(selectedIds) }),
            });
            if (res.ok) {
                setLeads(prev => prev.map(l =>
                    selectedIds.has(l.id) ? { ...l, campaign_id: campaignId } : l
                ));
                clearSelection();
            }
        } catch {
            // silent
        } finally {
            setBulkLoading(false);
        }
    };

    const handleAssignSingleLead = async (leadId: string, campaignId: string) => {
        setActionMenuId(null);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/add-leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'ids', leadIds: [leadId] }),
            });
            if (res.ok) {
                setLeads(prev => prev.map(l =>
                    l.id === leadId ? { ...l, campaign_id: campaignId } : l
                ));
                if (selectedLead?.id === leadId) {
                    setSelectedLead(prev => prev ? { ...prev, campaign_id: campaignId } : prev);
                }
            }
        } catch {
            // silent
        }
    };

    const handlePreview = (lead: Lead, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedLead(lead);
        setShowPreview(true);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/leads/export');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // silent fail
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setLeads(prev => prev.filter(l => l.id !== id));
                setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
                if (selectedLead?.id === id) {
                    setSelectedLead(null);
                    setShowPreview(false);
                }
            }
        } catch {
            // silent fail
        } finally {
            setDeletingId(null);
            setActionMenuId(null);
        }
    };

    const handleStatusChange = async (lead: Lead, newStatus: string) => {
        try {
            const res = await fetch(`/api/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const { lead: updated } = await res.json();
                setLeads(prev => prev.map(l => l.id === lead.id ? updated : l));
                if (selectedLead?.id === lead.id) setSelectedLead(updated);
            }
        } catch {
            // silent fail
        }
    };

    // --- Column filter helpers ---

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
                setActiveFilterColumn(null);
            }
        };
        if (activeFilterColumn) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeFilterColumn]);

    const columnOptions = useMemo(() => {
        const extract = (key: string, getter: (l: Lead) => string | null | undefined) => {
            const vals = new Set<string>();
            for (const l of leads) {
                const v = getter(l);
                if (v) vals.add(v);
            }
            return Array.from(vals).sort((a, b) => a.localeCompare(b));
        };
        return {
            stage: extract('stage', l => l.status),
            industry: extract('industry', l => l.industry),
            company: extract('company', l => l.company_name),
            location: extract('location', l => l.location),
            campaign: extract('campaign', l => l.campaign_id ? (campaigns.find(c => c.id === l.campaign_id)?.name ?? null) : null),
        };
    }, [leads, campaigns]);

    const toggleColumnFilter = (column: string, value: string) => {
        setColumnFilters(prev => {
            const current = new Set(prev[column] ?? []);
            if (current.has(value)) current.delete(value);
            else current.add(value);
            const next = { ...prev };
            if (current.size === 0) delete next[column];
            else next[column] = current;
            return next;
        });
    };

    const clearColumnFilter = (column: string) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            delete next[column];
            return next;
        });
    };

    const clearAllFilters = () => setColumnFilters({});

    const activeFilterCount = Object.keys(columnFilters).length;

    const getColumnValue = (lead: Lead, column: string): string | null => {
        switch (column) {
            case 'stage': return lead.status;
            case 'industry': return lead.industry;
            case 'company': return lead.company_name;
            case 'location': return lead.location;
            case 'campaign': return lead.campaign_id ? (campaigns.find(c => c.id === lead.campaign_id)?.name ?? null) : null;
            default: return null;
        }
    };

    // --- Multi-select handlers ---

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchQuery || [lead.full_name, lead.first_name, lead.last_name, lead.company_name, lead.job_title, lead.email]
            .some(f => f?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesColumns = Object.entries(columnFilters).every(([col, values]) => {
            const v = getColumnValue(lead, col);
            return v !== null && values.has(v);
        });
        return matchesSearch && matchesColumns;
    });

    const filteredIds = filteredLeads.map(l => l.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
    const someFilteredSelected = filteredIds.some(id => selectedIds.has(id));

    const toggleSelectAll = () => {
        if (allFilteredSelected) {
            // Deselect all filtered
            setSelectedIds(prev => {
                const next = new Set(prev);
                for (const id of filteredIds) next.delete(id);
                return next;
            });
        } else {
            // Select all filtered
            setSelectedIds(prev => {
                const next = new Set(prev);
                for (const id of filteredIds) next.add(id);
                return next;
            });
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const res = await fetch('/api/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', ids }),
            });
            if (res.ok) {
                setLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
                if (selectedLead && selectedIds.has(selectedLead.id)) {
                    setSelectedLead(null);
                    setShowPreview(false);
                }
                clearSelection();
            }
        } catch {
            // silent fail
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkStatus = async (newStatus: string) => {
        if (selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const res = await fetch('/api/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'status', ids, status: newStatus }),
            });
            if (res.ok) {
                const { leads: updated } = await res.json() as { leads: Lead[] };
                const updatedMap = new Map(updated.map((l: Lead) => [l.id, l]));
                setLeads(prev => prev.map(l => updatedMap.get(l.id) ?? l));
                if (selectedLead && updatedMap.has(selectedLead.id)) {
                    setSelectedLead(updatedMap.get(selectedLead.id)!);
                }
                clearSelection();
            }
        } catch {
            // silent fail
        } finally {
            setBulkLoading(false);
        }
    };

    const isEmpty = filteredLeads.length === 0;
    const statuses = ['new', 'enriched', 'contacted', 'replied', 'disqualified'];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        {t('leads.leadManagement')}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        {t('leads.title')} <Target className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium whitespace-pre-wrap">{t('leads.subtitle')}</p>
                </div>
                <div className="flex shrink-0 gap-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting || leads.length === 0}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-secondary-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {exporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        {t('leads.exportCsv')}
                    </button>
                    <button
                        onClick={() => router.push('/search')}
                        className="flex-1 md:flex-none btn-primary shadow-xl"
                    >
                        <Plus size={16} /> Find Leads
                    </button>
                </div>
            </header>

            {/* Pipeline Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <PipelineStat label={t('status.new')} count={stats.new ?? 0} color="bg-blue-500" delay="0" />
                <PipelineStat label={t('status.enriched')} count={stats.enriched ?? 0} color="bg-slate-400" delay="100" />
                <PipelineStat label={t('status.contacted')} count={stats.contacted ?? 0} color="bg-amber-500" delay="200" />
                <PipelineStat label={t('status.replied')} count={stats.replied ?? 0} color="bg-purple-500" delay="300" />
                <PipelineStat label={t('status.disqualified')} count={stats.disqualified ?? 0} color="bg-emerald-500" delay="400" />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 min-w-0 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder={t('leads.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-secondary-200 rounded-3xl py-4 pl-14 pr-4 transition-all focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-slate-900 shadow-sm"
                    />
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-primary-50 hover:bg-primary-100 border border-primary-300 rounded-3xl text-sm font-black uppercase tracking-widest text-primary-700 transition-all shadow-sm whitespace-nowrap"
                    >
                        <Filter size={18} />
                        {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                        <X size={14} className="text-primary-400 hover:text-red-500" />
                    </button>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-primary-200/50 dark:border-slate-600 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-primary-50/50 to-white dark:from-slate-800 dark:to-slate-800 animate-in fade-in duration-300 sticky top-4 z-40 shadow-lg">
                    <div className="flex items-center gap-3 flex-1">
                        <CheckSquare size={18} className="text-primary-600" />
                        <span className="text-sm font-black text-slate-900">
                            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <button onClick={clearSelection} className="text-xs font-bold text-secondary-400 hover:text-secondary-600 underline underline-offset-2">
                            Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {statuses.map(s => (
                            <button
                                key={s}
                                onClick={() => handleBulkStatus(s)}
                                disabled={bulkLoading}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white text-slate-600 border-secondary-200 hover:bg-secondary-50 transition-all disabled:opacity-50"
                            >
                                {s}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-secondary-200 mx-1" />
                        {/* Assign to Campaign */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCampaignMenu(!showCampaignMenu)}
                                disabled={bulkLoading}
                                className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-200 bg-white text-primary-600 hover:bg-primary-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Target size={12} />
                                Assign to Campaign
                            </button>
                            {showCampaignMenu && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowCampaignMenu(false)} />
                                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-600 rounded-2xl shadow-2xl z-[70] py-2 min-w-[220px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {campaigns.filter(c => c.status !== 'completed').length === 0 ? (
                                            <p className="px-4 py-3 text-xs text-secondary-400 font-medium">No active campaigns. Create one first.</p>
                                        ) : (
                                            campaigns
                                                .filter(c => c.status !== 'completed')
                                                .map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleAssignToCampaign(c.id)}
                                                        className="w-full px-4 py-2.5 text-left hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Target size={14} className="text-primary-500 shrink-0" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{c.name}</span>
                                                    </button>
                                                ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="w-px h-6 bg-secondary-200 mx-1" />
                        <button
                            onClick={handleBulkDelete}
                            disabled={bulkLoading}
                            className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {bulkLoading ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Main Pipeline Table */}
            <div className="glass-card shadow-2xl relative rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500 z-10"></div>

                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-secondary-100 rounded-[2rem] flex items-center justify-center mb-6">
                            <Target size={36} className="text-secondary-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                            {searchQuery || activeFilterCount > 0 ? 'No matching leads' : 'No leads yet'}
                        </h3>
                        <p className="text-secondary-500 max-w-md font-medium">
                            {searchQuery || activeFilterCount > 0
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Use the Advanced Search to discover prospects or run a scraping campaign to populate your pipeline.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed">
                            <colgroup>
                                <col className="w-[40px]" />
                                <col className="w-[22%]" />
                                <col className="w-[9%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[10%]" />
                                <col className="w-[10%]" />
                                <col className="w-[13%]" />
                            </colgroup>
                            <thead className="bg-secondary-50/30 border-b border-secondary-200/50 text-secondary-400 text-[9px] uppercase tracking-[0.2em] font-black">
                                <tr>
                                    <th className="px-2 py-3 pl-3">
                                        <button onClick={toggleSelectAll} className="text-secondary-400 hover:text-primary-600 transition-colors">
                                            {allFilteredSelected
                                                ? <CheckSquare size={16} className="text-primary-600" />
                                                : someFilteredSelected
                                                    ? <MinusSquare size={16} className="text-primary-400" />
                                                    : <Square size={16} />
                                            }
                                        </button>
                                    </th>
                                    <th className="px-2 py-3">Identity</th>
                                    <FilterableHeader column="stage" label="Stage" options={columnOptions.stage} activeColumn={activeFilterColumn} setActiveColumn={setActiveFilterColumn} filters={columnFilters} toggleFilter={toggleColumnFilter} clearFilter={clearColumnFilter} dropdownRef={filterDropdownRef} />
                                    <FilterableHeader column="industry" label="Industry" options={columnOptions.industry} activeColumn={activeFilterColumn} setActiveColumn={setActiveFilterColumn} filters={columnFilters} toggleFilter={toggleColumnFilter} clearFilter={clearColumnFilter} dropdownRef={filterDropdownRef} />
                                    <FilterableHeader column="company" label="Company" options={columnOptions.company} activeColumn={activeFilterColumn} setActiveColumn={setActiveFilterColumn} filters={columnFilters} toggleFilter={toggleColumnFilter} clearFilter={clearColumnFilter} dropdownRef={filterDropdownRef} />
                                    <FilterableHeader column="location" label="Location" options={columnOptions.location} activeColumn={activeFilterColumn} setActiveColumn={setActiveFilterColumn} filters={columnFilters} toggleFilter={toggleColumnFilter} clearFilter={clearColumnFilter} dropdownRef={filterDropdownRef} />
                                    <FilterableHeader column="campaign" label="Campaign" options={columnOptions.campaign} activeColumn={activeFilterColumn} setActiveColumn={setActiveFilterColumn} filters={columnFilters} toggleFilter={toggleColumnFilter} clearFilter={clearColumnFilter} dropdownRef={filterDropdownRef} />
                                    <th className="px-2 py-3">Touch</th>
                                    <th className="px-2 py-3 text-right pr-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100/30">
                                {filteredLeads.map((lead) => {
                                    const isSelected = selectedIds.has(lead.id);
                                    return (
                                        <tr
                                            key={lead.id}
                                            onClick={() => router.push(`/leads/${lead.id}`)}
                                            className={`group hover:bg-white transition-all cursor-pointer ${isSelected ? 'bg-primary-50/40' : ''} ${selectedLead?.id === lead.id ? 'bg-white shadow-inner' : ''}`}
                                        >
                                            <td className="px-2 py-3 pl-3">
                                                <button onClick={(e) => toggleSelect(lead.id, e)} className="text-secondary-400 hover:text-primary-600 transition-colors">
                                                    {isSelected
                                                        ? <CheckSquare size={16} className="text-primary-600" />
                                                        : <Square size={16} />
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary-50 to-secondary-200 text-secondary-700 flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-105 transition-all duration-500">
                                                            {(lead.full_name ?? lead.first_name ?? '?').charAt(0)}
                                                        </div>
                                                        {lead.linkedin_url && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg bg-[#0077b5]">
                                                                <Linkedin size={8} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 overflow-hidden">
                                                        <div className="font-black text-slate-900 group-hover:text-primary-700 transition-colors uppercase tracking-tighter text-[13px] truncate">
                                                            {lead.full_name ?? (`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || 'Unknown')}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[9px] font-bold text-secondary-500 uppercase tracking-wider truncate">{lead.job_title ?? lead.headline ?? '—'}</span>
                                                            {lead.linkedin_url && (
                                                                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#0077b5] hover:scale-110 transition-transform shrink-0">
                                                                    <Linkedin size={10} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <StageBadge stage={lead.status} />
                                            </td>
                                            <td className="px-2 py-3">
                                                {lead.industry ? (
                                                    <IndustryBadge industry={lead.industry} />
                                                ) : (
                                                    <span className="text-xs text-secondary-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 overflow-hidden">
                                                <span className="text-xs font-bold text-slate-700 truncate block">{lead.company_name ?? '—'}</span>
                                            </td>
                                            <td className="px-2 py-3 overflow-hidden">
                                                <span className="text-xs text-secondary-500 truncate block">{lead.location ?? '—'}</span>
                                            </td>
                                            <td className="px-2 py-3 overflow-hidden">
                                                <span className="text-xs font-bold text-slate-700 truncate block">
                                                    {lead.campaign_id ? (campaigns.find(c => c.id === lead.campaign_id)?.name ?? '—') : '—'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-secondary-400 uppercase tracking-wider">
                                                    <History size={12} className="text-secondary-300 shrink-0" />
                                                    <span className="truncate">{formatRelativeTime(lead.updated_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-right pr-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => handlePreview(lead, e)}
                                                        className="p-1.5 bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white rounded-md transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {lead.email && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/outreach?lead_id=${lead.id}`); }}
                                                            className="p-1.5 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-md transition-all"
                                                            title="Send Email"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDeleteLead(lead.id, e)}
                                                        disabled={deletingId === lead.id}
                                                        className="p-1.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-all"
                                                        title="Delete Lead"
                                                    >
                                                        {deletingId === lead.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === lead.id ? null : lead.id); }}
                                                            className="p-1.5 hover:bg-secondary-50 rounded-md text-secondary-400 hover:text-slate-900 transition-all"
                                                        >
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                        {actionMenuId === lead.id && (
                                                            <div className="absolute top-full right-0 mt-1 bg-white border border-secondary-200 rounded-xl shadow-2xl z-50 py-1 min-w-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
                                                                {campaigns.filter(c => c.status !== 'completed').length > 0 && (
                                                                    <>
                                                                        <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-secondary-400">Assign to Campaign</p>
                                                                        {campaigns.filter(c => c.status !== 'completed').map(c => (
                                                                            <button
                                                                                key={c.id}
                                                                                onClick={(e) => { e.stopPropagation(); handleAssignSingleLead(lead.id, c.id); }}
                                                                                className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary-50 transition-colors flex items-center gap-2 ${lead.campaign_id === c.id ? 'text-primary-600 bg-primary-50/50' : 'text-slate-600'}`}
                                                                            >
                                                                                <Target size={12} className="text-primary-500 shrink-0" />
                                                                                <span className="truncate">{c.name}</span>
                                                                                {lead.campaign_id === c.id && <span className="text-[9px] text-primary-400 ml-auto shrink-0">current</span>}
                                                                            </button>
                                                                        ))}
                                                                        <hr className="my-1 border-secondary-100" />
                                                                    </>
                                                                )}
                                                                <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-secondary-400">Set Status</p>
                                                                {statuses.filter(s => s !== lead.status).map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(lead, s); setActionMenuId(null); }}
                                                                        className="w-full px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-secondary-50"
                                                                    >
                                                                        {s}
                                                                    </button>
                                                                ))}
                                                                <hr className="my-1 border-secondary-100" />
                                                                <button
                                                                    onClick={(e) => handleDeleteLead(lead.id, e)}
                                                                    disabled={deletingId === lead.id}
                                                                    className="w-full px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    {deletingId === lead.id ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Lead Detail Modal */}
            {showPreview && selectedLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full max-w-2xl card p-0 overflow-hidden animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-widest">Lead Details</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{selectedLead.full_name ?? 'Unknown'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Email</span>
                                        <p className="font-bold text-slate-900 mt-1">{selectedLead.email ?? 'Not available'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Company</span>
                                        <p className="font-bold text-slate-900 mt-1">{selectedLead.company_name ?? '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Job Title</span>
                                        <p className="font-bold text-slate-900 mt-1">{selectedLead.job_title ?? selectedLead.headline ?? '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Location</span>
                                        <p className="font-bold text-slate-900 mt-1">{selectedLead.location ?? '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Industry</span>
                                        <div className="mt-1">
                                            {selectedLead.industry
                                                ? <IndustryBadge industry={selectedLead.industry} />
                                                : <span className="font-bold text-slate-900">—</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                {selectedLead.linkedin_url && (
                                    <a
                                        href={selectedLead.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[10px] font-black text-[#0077b5] bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest"
                                    >
                                        <Linkedin size={12} /> View LinkedIn Profile
                                    </a>
                                )}
                            </div>
                            {campaigns.filter(c => c.status !== 'completed').length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Assign to Campaign</p>
                                    <div className="flex flex-wrap gap-2">
                                        {campaigns.filter(c => c.status !== 'completed').map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { handleAssignSingleLead(selectedLead.id, c.id); }}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 ${selectedLead.campaign_id === c.id ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-white text-slate-600 border-secondary-200 hover:bg-primary-50'}`}
                                            >
                                                <Target size={10} />
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Change Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {statuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => { handleStatusChange(selectedLead, s); setShowPreview(false); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedLead.status === s ? 'bg-primary-100 text-primary-700 border-primary-200' : 'bg-white text-slate-600 border-secondary-200 hover:bg-secondary-50'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => { handleDeleteLead(selectedLead.id, { stopPropagation: () => {} } as React.MouseEvent); setShowPreview(false); }}
                                    className="flex-1 py-4 bg-white border border-red-200 rounded-2xl text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete Lead
                                </button>
                                {selectedLead.email ? (
                                    <button
                                        onClick={() => router.push(`/outreach?lead_id=${selectedLead.id}`)}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
                                    >
                                        Send Email <Send size={14} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { handleStatusChange(selectedLead, 'contacted'); setShowPreview(false); }}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
                                    >
                                        Mark Contacted <Send size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Insight Card (single lead) */}
            {selectedLead && !showPreview && selectedIds.size === 0 && (
                <div className="card p-8 bg-gradient-to-br from-white to-primary-50/30 animate-in slide-in-from-bottom-8 duration-500 flex flex-col lg:flex-row items-center gap-10 border-primary-200/50 shadow-2xl overflow-hidden relative group">
                    <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                        <Activity size={240} className="text-primary-600" />
                    </div>

                    <div className="flex gap-8 items-center flex-1">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white shadow-2xl border border-primary-100 flex items-center justify-center text-4xl font-black text-primary-600 group-hover:scale-110 transition-transform duration-500">
                            {(selectedLead.full_name ?? '?').charAt(0)}
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{selectedLead.full_name ?? 'Unknown'}</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                {selectedLead.linkedin_url && (
                                    <DetailBadge icon={<Linkedin size={14} />} label="LinkedIn" color="text-[#0077b5]" />
                                )}
                                {selectedLead.email && (
                                    <DetailBadge icon={<Mail size={14} />} label="Email Available" color="text-purple-600" />
                                )}
                                <DetailBadge icon={<Calendar size={14} />} label={`Added ${formatRelativeTime(selectedLead.created_at)}`} color="text-slate-600" />
                                <StageBadge stage={selectedLead.status} />
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-4 w-full lg:w-auto">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex-1 lg:flex-none px-10 py-4 bg-white border border-secondary-200 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary-50 transition-all shadow-sm active:scale-95"
                        >
                            Full Intel
                        </button>
                        {selectedLead.email ? (
                            <button
                                onClick={() => router.push(`/outreach?lead_id=${selectedLead.id}`)}
                                className="flex-1 lg:flex-none px-10 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-2xl shadow-slate-900/30 active:scale-95 flex items-center justify-center gap-3 group/btn"
                            >
                                Send Email <Send size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusChange(selectedLead, 'contacted')}
                                className="flex-1 lg:flex-none px-10 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-2xl shadow-slate-900/30 active:scale-95 flex items-center justify-center gap-3 group/btn"
                            >
                                Mark Contacted <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
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

function PipelineStat({ label, count, color, delay }: { label: string; count: number; color: string; delay: string }) {
    return (
        <div
            className="card p-6 hover:shadow-2xl transition-all group overflow-hidden relative cursor-default animate-in slide-in-from-bottom-4"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100 to-transparent rotate-45 translate-x-8 -translate-y-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 group-hover:text-secondary-700 transition-colors">{label}</span>
                <div className={`w-3 h-3 rounded-full ${color} shadow-lg`}></div>
            </div>
            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter italic group-hover:scale-110 transition-transform origin-left">{count}</p>
        </div>
    );
}

function StageBadge({ stage }: { stage: string }) {
    let styles = "bg-secondary-100/50 text-secondary-700 border-secondary-200/50";

    switch (stage) {
        case 'new': styles = "bg-blue-50 text-blue-700 border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.1)]"; break;
        case 'enriched': styles = "bg-slate-50 text-slate-600 border-slate-200"; break;
        case 'contacted': styles = "bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]"; break;
        case 'replied': styles = "bg-purple-50 text-purple-700 border-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]"; break;
        case 'disqualified': styles = "bg-red-50 text-red-700 border-red-200"; break;
    }

    return (
        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border italic ${styles}`}>
            {stage}
        </span>
    );
}

function DetailBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${color}`}>
            {icon} {label}
        </div>
    );
}

const INDUSTRY_COLORS: Record<string, string> = {
    automotive: 'bg-red-50 text-red-700 border-red-200',
    'real estate': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    banking: 'bg-amber-50 text-amber-700 border-amber-200',
    'financial services': 'bg-amber-50 text-amber-700 border-amber-200',
    insurance: 'bg-amber-50 text-amber-700 border-amber-200',
    'computer software': 'bg-blue-50 text-blue-700 border-blue-200',
    'information technology and services': 'bg-blue-50 text-blue-700 border-blue-200',
    internet: 'bg-blue-50 text-blue-700 border-blue-200',
    'hospital & health care': 'bg-pink-50 text-pink-700 border-pink-200',
    'health, wellness and fitness': 'bg-pink-50 text-pink-700 border-pink-200',
    pharmaceuticals: 'bg-pink-50 text-pink-700 border-pink-200',
    construction: 'bg-orange-50 text-orange-700 border-orange-200',
    'building materials': 'bg-orange-50 text-orange-700 border-orange-200',
    'marketing and advertising': 'bg-purple-50 text-purple-700 border-purple-200',
    'management consulting': 'bg-purple-50 text-purple-700 border-purple-200',
    retail: 'bg-teal-50 text-teal-700 border-teal-200',
    'food & beverages': 'bg-teal-50 text-teal-700 border-teal-200',
    hospitality: 'bg-teal-50 text-teal-700 border-teal-200',
    'oil & energy': 'bg-slate-100 text-slate-700 border-slate-300',
    'mining & metals': 'bg-slate-100 text-slate-700 border-slate-300',
    education: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'education management': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'e-learning': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function formatIndustryLabel(industry: string): string {
    return industry
        .split(/[\s/]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function IndustryBadge({ industry }: { industry: string }) {
    const key = industry.toLowerCase();
    const colors = INDUSTRY_COLORS[key] ?? 'bg-sky-50 text-sky-700 border-sky-200';
    return (
        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${colors}`}>
            {formatIndustryLabel(industry)}
        </span>
    );
}

function FilterableHeader({
    column,
    label,
    options,
    activeColumn,
    setActiveColumn,
    filters,
    toggleFilter,
    clearFilter,
    dropdownRef,
}: {
    column: string;
    label: string;
    options: string[];
    activeColumn: string | null;
    setActiveColumn: (col: string | null) => void;
    filters: Record<string, Set<string>>;
    toggleFilter: (col: string, val: string) => void;
    clearFilter: (col: string) => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
    const isOpen = activeColumn === column;
    const hasFilter = column in filters;
    const selectedCount = filters[column]?.size ?? 0;
    const [filterSearch, setFilterSearch] = useState('');

    const displayOptions = filterSearch
        ? options.filter(o => o.toLowerCase().includes(filterSearch.toLowerCase()))
        : options;

    return (
        <th className="px-2 py-3 relative">
            <button
                onClick={() => setActiveColumn(isOpen ? null : column)}
                className={`flex items-center gap-1 hover:text-primary-600 transition-colors ${hasFilter ? 'text-primary-600' : ''}`}
            >
                {label}
                {hasFilter && (
                    <span className="ml-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[8px] flex items-center justify-center font-black not-italic">
                        {selectedCount}
                    </span>
                )}
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-1 bg-white border border-secondary-200 rounded-2xl shadow-2xl z-50 py-2 min-w-[200px] max-h-[320px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {options.length > 6 && (
                        <div className="px-3 pb-2">
                            <input
                                type="text"
                                placeholder={`Search ${label.toLowerCase()}...`}
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-secondary-200 rounded-lg outline-none focus:border-primary-400 font-medium text-slate-700"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {displayOptions.length === 0 ? (
                            <p className="px-4 py-2 text-xs text-secondary-400 font-medium">No matches</p>
                        ) : (
                            displayOptions.map(val => {
                                const isChecked = filters[column]?.has(val) ?? false;
                                return (
                                    <button
                                        key={val}
                                        onClick={(e) => { e.stopPropagation(); toggleFilter(column, val); }}
                                        className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-secondary-50 transition-colors flex items-center gap-2.5"
                                    >
                                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-primary-500 border-primary-500 text-white' : 'border-secondary-300'}`}>
                                            {isChecked && <span className="text-[10px]">&#10003;</span>}
                                        </span>
                                        <span className={`truncate ${isChecked ? 'text-primary-700' : 'text-slate-600'}`}>{val}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {hasFilter && (
                        <>
                            <hr className="my-1 border-secondary-100" />
                            <button
                                onClick={(e) => { e.stopPropagation(); clearFilter(column); setFilterSearch(''); }}
                                className="w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-red-500 hover:bg-secondary-50 transition-colors"
                            >
                                Clear filter
                            </button>
                        </>
                    )}
                </div>
            )}
        </th>
    );
}
