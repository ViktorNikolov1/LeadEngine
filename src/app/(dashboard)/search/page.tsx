'use client';

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
    Search as SearchIcon,
    Building,
    MapPin,
    Target,
    Sparkles,
    Loader2,
    Zap,
    Award,
    Globe,
    Plus,
    ArrowRight,
    Linkedin,
    Download,
    Send,
    X,
    ChevronDown,
    Mail,
    DollarSign,
    Briefcase,
    Hash,
    FileText,
    Factory,
    Tags,
    Banknote,
    MessageSquare,
    Wand2,
    Upload,
    CheckCircle,
    AlertCircle,
    FileSpreadsheet,
} from 'lucide-react';
import type { Lead } from '@/types';

// --- Option data for select fields ---

const SENIORITY_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'owner', label: 'Owner' },
    { value: 'founder', label: 'Founder' },
    { value: 'c_suite', label: 'C-Suite' },
    { value: 'partner', label: 'Partner' },
    { value: 'vp', label: 'VP' },
    { value: 'head', label: 'Head' },
    { value: 'director', label: 'Director' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior', label: 'Senior' },
    { value: 'entry', label: 'Entry' },
    { value: 'intern', label: 'Intern' },
];

const FUNCTIONAL_LEVEL_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'business_development', label: 'Business Development' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'education', label: 'Education' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'finance', label: 'Finance' },
    { value: 'human_resources', label: 'Human Resources' },
    { value: 'information_technology', label: 'Information Technology' },
    { value: 'legal', label: 'Legal' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'media', label: 'Media' },
    { value: 'operations', label: 'Operations' },
    { value: 'product', label: 'Product' },
    { value: 'sales', label: 'Sales' },
    { value: 'support', label: 'Support' },
];

const LOCATION_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'africa', label: 'Africa' },
    { value: 'asia', label: 'Asia' },
    { value: 'europe', label: 'Europe' },
    { value: 'emea', label: 'EMEA' },
    { value: 'middle east', label: 'Middle East' },
    { value: 'north america', label: 'North America' },
    { value: 'south america', label: 'South America' },
    { value: 'oceania', label: 'Oceania' },
    { value: 'united states', label: 'United States' },
    { value: 'united kingdom', label: 'United Kingdom' },
    { value: 'germany', label: 'Germany' },
    { value: 'france', label: 'France' },
    { value: 'spain', label: 'Spain' },
    { value: 'netherlands', label: 'Netherlands' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'india', label: 'India' },
    { value: 'brazil', label: 'Brazil' },
    { value: 'mexico', label: 'Mexico' },
    { value: 'italy', label: 'Italy' },
    { value: 'sweden', label: 'Sweden' },
    { value: 'switzerland', label: 'Switzerland' },
    { value: 'ireland', label: 'Ireland' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'japan', label: 'Japan' },
    { value: 'california, us', label: 'California, US' },
    { value: 'new york, us', label: 'New York, US' },
    { value: 'texas, us', label: 'Texas, US' },
    { value: 'florida, us', label: 'Florida, US' },
];

const EMAIL_STATUS_OPTIONS = [
    { value: 'validated', label: 'Validated' },
    { value: 'guessed', label: 'Guessed' },
    { value: 'unavailable', label: 'Unavailable' },
];

const COMPANY_SIZE_OPTIONS = [
    { value: '', label: 'Any' },
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '201-500', label: '201-500' },
    { value: '501-1000', label: '501-1,000' },
    { value: '1001-5000', label: '1,001-5,000' },
    { value: '5001-10000', label: '5,001-10,000' },
    { value: '10001+', label: '10,001+' },
];

const INDUSTRY_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'airlines/aviation', label: 'Airlines / Aviation' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'banking', label: 'Banking' },
    { value: 'biotechnology', label: 'Biotechnology' },
    { value: 'building materials', label: 'Building Materials' },
    { value: 'computer software', label: 'Computer Software' },
    { value: 'construction', label: 'Construction' },
    { value: 'consumer goods', label: 'Consumer Goods' },
    { value: 'e-learning', label: 'E-Learning' },
    { value: 'education management', label: 'Education Management' },
    { value: 'electrical/electronic manufacturing', label: 'Electrical / Electronic Mfg' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'environmental services', label: 'Environmental Services' },
    { value: 'financial services', label: 'Financial Services' },
    { value: 'food & beverages', label: 'Food & Beverages' },
    { value: 'health, wellness and fitness', label: 'Health, Wellness & Fitness' },
    { value: 'hospital & health care', label: 'Hospital & Health Care' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'human resources', label: 'Human Resources' },
    { value: 'information technology and services', label: 'IT & Services' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'internet', label: 'Internet' },
    { value: 'legal services', label: 'Legal Services' },
    { value: 'logistics and supply chain', label: 'Logistics & Supply Chain' },
    { value: 'management consulting', label: 'Management Consulting' },
    { value: 'marketing and advertising', label: 'Marketing & Advertising' },
    { value: 'mechanical or industrial engineering', label: 'Mechanical / Industrial Eng.' },
    { value: 'media production', label: 'Media Production' },
    { value: 'mining & metals', label: 'Mining & Metals' },
    { value: 'oil & energy', label: 'Oil & Energy' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
    { value: 'real estate', label: 'Real Estate' },
    { value: 'retail', label: 'Retail' },
    { value: 'staffing and recruiting', label: 'Staffing & Recruiting' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'transportation/trucking/railroad', label: 'Transportation' },
];

const REVENUE_OPTIONS = [
    { value: '', label: 'Any' },
    { value: '0', label: '$0' },
    { value: '1000000', label: '$1M' },
    { value: '5000000', label: '$5M' },
    { value: '10000000', label: '$10M' },
    { value: '25000000', label: '$25M' },
    { value: '50000000', label: '$50M' },
    { value: '100000000', label: '$100M' },
    { value: '250000000', label: '$250M' },
    { value: '500000000', label: '$500M' },
    { value: '1000000000', label: '$1B+' },
];

const FUNDING_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'seed', label: 'Seed' },
    { value: 'angel', label: 'Angel' },
    { value: 'venture', label: 'Venture (Series A-C)' },
    { value: 'series_a', label: 'Series A' },
    { value: 'series_b', label: 'Series B' },
    { value: 'series_c', label: 'Series C' },
    { value: 'series_d', label: 'Series D+' },
    { value: 'private_equity', label: 'Private Equity' },
    { value: 'ipo', label: 'IPO' },
    { value: 'other', label: 'Other' },
];

// --- Main page ---

export default function SearchPage() {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Lead[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchSource, setSearchSource] = useState<'database' | 'apify' | 'ai'>('database');
    const [scrapingProgress, setScrapingProgress] = useState('');

    // AI natural language search
    const [aiQuery, setAiQuery] = useState('');
    const [aiParsedFilters, setAiParsedFilters] = useState<Record<string, unknown> | null>(null);
    const [aiParsing, setAiParsing] = useState(false);

    // Database search (simple)
    const [dbJobTitle, setDbJobTitle] = useState('');
    const [dbLocation, setDbLocation] = useState('');
    const [dbIndustry, setDbIndustry] = useState('');

    // CSV Import
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Apify filters — full actor schema
    const [fetchCount, setFetchCount] = useState(100);
    const [fileName, setFileName] = useState('Prospects');
    const [jobTitles, setJobTitles] = useState<string[]>([]);
    const [excludeJobTitles, setExcludeJobTitles] = useState<string[]>([]);
    const [seniorityLevel, setSeniorityLevel] = useState<string[]>([]);
    const [functionalLevel, setFunctionalLevel] = useState<string[]>([]);
    const [contactLocation, setContactLocation] = useState<string[]>([]);
    const [contactCities, setContactCities] = useState<string[]>([]);
    const [excludeLocation, setExcludeLocation] = useState<string[]>([]);
    const [excludeCities, setExcludeCities] = useState<string[]>([]);
    const [emailStatus, setEmailStatus] = useState<string[]>(['validated']);
    const [companyDomains, setCompanyDomains] = useState<string[]>([]);
    const [companySize, setCompanySize] = useState<string[]>([]);
    const [industry, setIndustry] = useState<string[]>([]);
    const [excludeIndustry, setExcludeIndustry] = useState<string[]>([]);
    const [companyKeywords, setCompanyKeywords] = useState<string[]>([]);
    const [excludeCompanyKeywords, setExcludeCompanyKeywords] = useState<string[]>([]);
    const [minRevenue, setMinRevenue] = useState('');
    const [maxRevenue, setMaxRevenue] = useState('');
    const [funding, setFunding] = useState<string[]>([]);

    const handleExport = () => {
        if (results.length === 0) return;
        const headers = ['Full Name', 'Email', 'Job Title', 'Company', 'Location', 'LinkedIn URL'];
        const rows = results.map(l => [
            l.full_name ?? '', l.email ?? '', l.job_title ?? '', l.company_name ?? '', l.location ?? '', l.linkedin_url ?? '',
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', importFile);
            if (dbIndustry) formData.append('industry', dbIndustry);

            const res = await fetch('/api/leads/import', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                setImportResult({
                    success: false,
                    message: data.error ?? 'Import failed',
                    details: data.saved ? `${data.saved} leads saved before error.` : undefined,
                });
            } else {
                setImportResult({
                    success: true,
                    message: data.message,
                    details: `${data.saved} saved, ${data.skipped} skipped (missing email/LinkedIn). Columns detected: ${data.detected_columns.join(', ')}`,
                });
                setImportFile(null);
            }
        } catch {
            setImportResult({
                success: false,
                message: 'Failed to upload file. Please try again.',
            });
        } finally {
            setImporting(false);
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        setHasSearched(true);
        setError(null);
        setScrapingProgress('');

        try {
            if (searchSource === 'database') {
                const params = new URLSearchParams();
                if (dbJobTitle) params.set('jobTitle', dbJobTitle);
                if (dbLocation) params.set('location', dbLocation);
                if (dbIndustry) params.set('industry', dbIndustry);

                const res = await fetch(`/api/leads/search?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error ?? 'Search failed');
                    setResults([]);
                } else {
                    setResults(data.leads ?? []);
                }
            } else if (searchSource === 'ai') {
                if (!aiQuery.trim() || aiQuery.trim().length < 5) {
                    setError('Please describe in more detail what kind of leads you want to find');
                    setIsSearching(false);
                    return;
                }

                // Step 1: Parse query with AI
                setScrapingProgress('Analyzing your search with AI...');
                const parseRes = await fetch('/api/search/parse-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: aiQuery }),
                });
                const parseData = await parseRes.json();

                if (!parseRes.ok) {
                    setError(parseData.error ?? 'Failed to parse search query');
                    setIsSearching(false);
                    return;
                }

                const filters = parseData.filters;
                setAiParsedFilters(filters);

                // Step 2: Run scraper with parsed filters
                setScrapingProgress('Searching prospects via Apify...');
                const res = await fetch('/api/run-scraper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fetchCount: filters.fetchCount ?? 25,
                        fileName: 'AI Search',
                        jobTitles: filters.jobTitles ?? [],
                        excludeJobTitles: filters.excludeJobTitles ?? [],
                        seniorityLevel: filters.seniorityLevel ?? null,
                        functionalLevel: filters.functionalLevel ?? null,
                        contactLocation: filters.contactLocation ?? null,
                        contactCities: filters.contactCities ?? [],
                        excludeLocation: filters.excludeLocation ?? null,
                        excludeCities: filters.excludeCities ?? [],
                        emailStatus: filters.emailStatus ?? ['validated'],
                        companyDomains: filters.companyDomains ?? [],
                        companySize: filters.companySize ?? null,
                        industry: filters.industry ?? null,
                        excludeIndustry: filters.excludeIndustry ?? null,
                        companyKeywords: filters.companyKeywords ?? [],
                        excludeCompanyKeywords: filters.excludeCompanyKeywords ?? [],
                        minRevenue: filters.minRevenue ?? null,
                        maxRevenue: filters.maxRevenue ?? null,
                        funding: filters.funding ?? null,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error ?? 'Prospect search failed');
                    setResults([]);
                } else {
                    setResults(data.leads ?? []);
                }
            } else {
                const hasFilter = jobTitles.length > 0 || contactLocation.length > 0 || contactCities.length > 0
                    || industry.length > 0 || companyDomains.length > 0 || companyKeywords.length > 0
                    || seniorityLevel.length > 0 || functionalLevel.length > 0;

                if (!hasFilter) {
                    setError('Provide at least one search filter');
                    setIsSearching(false);
                    return;
                }

                setScrapingProgress('Searching prospects via Apify...');

                const res = await fetch('/api/run-scraper', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fetchCount,
                        fileName,
                        jobTitles,
                        excludeJobTitles,
                        seniorityLevel,
                        functionalLevel,
                        contactLocation,
                        contactCities,
                        excludeLocation,
                        excludeCities,
                        emailStatus,
                        companyDomains,
                        companySize,
                        industry,
                        excludeIndustry,
                        companyKeywords,
                        excludeCompanyKeywords,
                        minRevenue: minRevenue || null,
                        maxRevenue: maxRevenue || null,
                        funding,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error ?? 'Prospect search failed');
                    setResults([]);
                } else {
                    setResults(data.leads ?? []);
                }
            }
        } catch {
            setError(searchSource === 'database'
                ? 'Failed to connect to the search engine'
                : 'Prospect search failed — check your Apify credentials in .env.local');
            setResults([]);
        } finally {
            setIsSearching(false);
            setScrapingProgress('');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-secondary-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary-600 font-black text-[10px] uppercase tracking-[0.3em]">
                        Prospecting Engine
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        Advanced Search <Sparkles className="text-primary-500" size={28} />
                    </h1>
                    <p className="text-secondary-500 font-medium">Search your database or find new prospects via Apify.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-secondary-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-secondary-50 transition-all shadow-sm"
                    >
                        View Campaigns
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* ---------- LEFT: Filters ---------- */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Source Toggle */}
                    <div className="card p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-y-16 translate-x-16" />
                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Globe size={14} className="text-indigo-500" /> Data Source
                        </label>
                        <div className="flex bg-secondary-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setSearchSource('ai')}
                                className={`flex-1 text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 ${searchSource === 'ai' ? 'bg-white shadow-lg text-slate-900' : 'text-secondary-400 hover:text-secondary-600'}`}
                            ><Wand2 size={12} /> AI</button>
                            <button
                                onClick={() => setSearchSource('apify')}
                                className={`flex-1 text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest ${searchSource === 'apify' ? 'bg-white shadow-lg text-slate-900' : 'text-secondary-400 hover:text-secondary-600'}`}
                            >Filters</button>
                            <button
                                onClick={() => setSearchSource('database')}
                                className={`flex-1 text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest ${searchSource === 'database' ? 'bg-white shadow-lg text-slate-900' : 'text-secondary-400 hover:text-secondary-600'}`}
                            >DB</button>
                        </div>
                    </div>

                    {searchSource === 'ai' ? (
                        /* ----- AI natural language search ----- */
                        <div className="card p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                                    <Wand2 size={16} className="text-white" />
                                </div>
                                <div>
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest block">AI Search</span>
                                    <span className="text-[10px] text-secondary-400 font-medium">Describe what you're looking for</span>
                                </div>
                            </div>
                            <textarea
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                placeholder={"e.g. I want 20 leads in the automotive sector in Madrid, Spain. Looking for CEOs and directors at companies with more than 50 employees..."}
                                rows={6}
                                className="input-field resize-none"
                            />
                            {aiParsedFilters && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-primary-500" /> Detected Filters
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(aiParsedFilters)
                                            .filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
                                            .filter(([k]) => k !== 'fetchCount' && k !== 'emailStatus')
                                            .map(([key, value]) => (
                                                <span
                                                    key={key}
                                                    className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-bold border border-primary-100"
                                                >
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}: {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : searchSource === 'database' ? (
                        /* ----- Database simple filters + Import ----- */
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="card p-6 shadow-xl space-y-5">
                                <FilterInput label="Job Title / Keyword" placeholder="e.g. CTO, VP Marketing" icon={<Award size={14} className="text-primary-500" />} value={dbJobTitle} onChange={setDbJobTitle} />
                                <FilterInput label="Location" placeholder="e.g. London, Germany" icon={<MapPin size={14} className="text-blue-500" />} value={dbLocation} onChange={setDbLocation} />
                                <FilterInput label="Industry / Company" placeholder="e.g. Fintech, Stripe" icon={<Building size={14} className="text-purple-500" />} value={dbIndustry} onChange={setDbIndustry} />
                            </div>

                            {/* Import Database Section */}
                            <div className="card p-6 shadow-xl space-y-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                        <Upload size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest block">Import Database</span>
                                        <span className="text-[10px] text-secondary-400 font-medium">Upload a CSV file with your leads</span>
                                    </div>
                                </div>

                                {/* Drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        const file = e.dataTransfer.files[0];
                                        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt'))) {
                                            setImportFile(file);
                                            setImportResult(null);
                                        }
                                    }}
                                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
                                        dragOver
                                            ? 'border-emerald-400 bg-emerald-50/50'
                                            : importFile
                                                ? 'border-primary-300 bg-primary-50/30'
                                                : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50/10'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        accept=".csv,.tsv,.txt"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImportFile(file);
                                                setImportResult(null);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {importFile ? (
                                        <div className="space-y-2">
                                            <FileSpreadsheet size={28} className="text-primary-500 mx-auto" />
                                            <p className="text-sm font-black text-slate-900 truncate">{importFile.name}</p>
                                            <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">
                                                {(importFile.size / 1024).toFixed(1)} KB
                                            </p>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImportFile(null); setImportResult(null); }}
                                                className="text-[10px] font-bold text-red-500 hover:text-red-700 underline underline-offset-2"
                                            >
                                                Remove file
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload size={28} className="text-secondary-300 mx-auto group-hover:text-primary-400 transition-colors" />
                                            <p className="text-xs font-bold text-slate-700">
                                                Drop your CSV here or <span className="text-primary-600">browse</span>
                                            </p>
                                            <p className="text-[10px] text-secondary-400 font-medium">
                                                Supports .csv files up to 10MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Column info */}
                                <div className="text-[10px] text-secondary-400 font-medium space-y-1">
                                    <p className="font-black text-secondary-500 uppercase tracking-widest">Auto-detected columns:</p>
                                    <p>name, email, linkedin, company, job title, location, industry, domain</p>
                                </div>

                                {/* Import button */}
                                {importFile && (
                                    <button
                                        onClick={handleImport}
                                        disabled={importing}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                                    >
                                        {importing ? (
                                            <><Loader2 className="animate-spin" size={16} /> Importing...</>
                                        ) : (
                                            <><Upload size={16} /> Import {importFile.name}</>
                                        )}
                                    </button>
                                )}

                                {/* Import result feedback */}
                                {importResult && (
                                    <div className={`p-4 rounded-xl border text-sm font-medium animate-in fade-in duration-300 ${
                                        importResult.success
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {importResult.success
                                                ? <CheckCircle size={16} className="text-emerald-600" />
                                                : <AlertCircle size={16} className="text-red-600" />
                                            }
                                            <span className="font-black text-xs uppercase tracking-widest">
                                                {importResult.success ? 'Import Successful' : 'Import Failed'}
                                            </span>
                                        </div>
                                        <p className="text-xs">{importResult.message}</p>
                                        {importResult.details && (
                                            <p className="text-[10px] mt-1 opacity-75">{importResult.details}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ----- Apify full filters ----- */
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Fetch count & file name */}
                            <FilterSection icon={<Hash size={14} className="text-slate-500" />} title="Run Settings">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5 block">Number of leads</label>
                                        <input
                                            type="number" min={1} max={100000} value={fetchCount}
                                            onChange={(e) => setFetchCount(Math.min(100000, Math.max(1, Number(e.target.value))))}
                                            className="input-field"
                                        />
                                    </div>
                                    <FilterInput label="Run Label" placeholder="Prospects" icon={<FileText size={14} className="text-secondary-400" />} value={fileName} onChange={setFileName} />
                                </div>
                            </FilterSection>

                            {/* Job Title */}
                            <FilterSection icon={<Briefcase size={14} className="text-primary-500" />} title="Job Title">
                                <div className="space-y-3">
                                    <TagInput label="Include Job Titles" placeholder="e.g. realtor, developer" tags={jobTitles} onChange={setJobTitles} />
                                    <TagInput label="Exclude Job Titles" placeholder="e.g. intern, assistant" tags={excludeJobTitles} onChange={setExcludeJobTitles} />
                                    <MultiSelectField label="Seniority Level" selected={seniorityLevel} onChange={setSeniorityLevel} options={SENIORITY_OPTIONS} />
                                    <MultiSelectField label="Functional Level" selected={functionalLevel} onChange={setFunctionalLevel} options={FUNCTIONAL_LEVEL_OPTIONS} />
                                </div>
                            </FilterSection>

                            {/* Location Include */}
                            <FilterSection icon={<MapPin size={14} className="text-blue-500" />} title="Location (Include)">
                                <div className="space-y-3">
                                    <MultiSelectField label="Region / Country / State" selected={contactLocation} onChange={setContactLocation} options={LOCATION_OPTIONS} />
                                    <TagInput label="City" placeholder="e.g. Berlin, London" tags={contactCities} onChange={setContactCities} />
                                </div>
                            </FilterSection>

                            {/* Location Exclude */}
                            <FilterSection icon={<MapPin size={14} className="text-red-400" />} title="Location (Exclude)">
                                <div className="space-y-3">
                                    <MultiSelectField label="Region / Country / State" selected={excludeLocation} onChange={setExcludeLocation} options={LOCATION_OPTIONS} />
                                    <TagInput label="City" placeholder="e.g. Paris, Rome" tags={excludeCities} onChange={setExcludeCities} />
                                </div>
                            </FilterSection>

                            {/* Email Status */}
                            <FilterSection icon={<Mail size={14} className="text-emerald-500" />} title="Email Status">
                                <div className="flex flex-wrap gap-2">
                                    {EMAIL_STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setEmailStatus(prev =>
                                                    prev.includes(opt.value)
                                                        ? prev.filter(v => v !== opt.value)
                                                        : [...prev, opt.value]
                                                );
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                emailStatus.includes(opt.value)
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-white text-secondary-400 border-secondary-200 hover:border-secondary-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Company */}
                            <FilterSection icon={<Building size={14} className="text-purple-500" />} title="Company">
                                <div className="space-y-3">
                                    <TagInput label="Company Domains" placeholder="e.g. google.com, apple.com" tags={companyDomains} onChange={setCompanyDomains} />
                                    <MultiSelectField label="Company Size" selected={companySize} onChange={setCompanySize} options={COMPANY_SIZE_OPTIONS} />
                                </div>
                            </FilterSection>

                            {/* Industry */}
                            <FilterSection icon={<Factory size={14} className="text-amber-500" />} title="Industry">
                                <div className="space-y-3">
                                    <MultiSelectField label="Include Industry" selected={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} />
                                    <MultiSelectField label="Exclude Industry" selected={excludeIndustry} onChange={setExcludeIndustry} options={INDUSTRY_OPTIONS} />
                                </div>
                            </FilterSection>

                            {/* Keywords */}
                            <FilterSection icon={<Tags size={14} className="text-teal-500" />} title="Keywords">
                                <div className="space-y-3">
                                    <TagInput label="Include Keywords" placeholder="e.g. SaaS, fitness" tags={companyKeywords} onChange={setCompanyKeywords} />
                                    <TagInput label="Exclude Keywords" placeholder="e.g. nonprofit, gov" tags={excludeCompanyKeywords} onChange={setExcludeCompanyKeywords} />
                                </div>
                            </FilterSection>

                            {/* Revenue */}
                            <FilterSection icon={<DollarSign size={14} className="text-green-500" />} title="Revenue">
                                <div className="grid grid-cols-2 gap-3">
                                    <SelectField label="Min Revenue" value={minRevenue} onChange={setMinRevenue} options={REVENUE_OPTIONS} />
                                    <SelectField label="Max Revenue" value={maxRevenue} onChange={setMaxRevenue} options={REVENUE_OPTIONS} />
                                </div>
                            </FilterSection>

                            {/* Funding */}
                            <FilterSection icon={<Banknote size={14} className="text-violet-500" />} title="Funding">
                                <MultiSelectField label="Funding Stage" selected={funding} onChange={setFunding} options={FUNDING_OPTIONS} />
                            </FilterSection>
                        </div>
                    )}

                    {/* Search button */}
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="btn-primary w-full h-14 group sticky bottom-4"
                    >
                        {isSearching ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : searchSource === 'ai' ? (
                            <>Search with AI <Wand2 size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
                        ) : searchSource === 'apify' ? (
                            <>Find Prospects <Zap size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /></>
                        ) : (
                            <>Search Database <Zap size={16} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" /></>
                        )}
                    </button>
                </div>

                {/* ---------- RIGHT: Results ---------- */}
                <div className="lg:col-span-3 space-y-6 min-h-[600px]">
                    {!hasSearched ? (
                        <div className="h-full glass-card flex flex-col items-center justify-center text-center p-16 animate-in fade-in duration-1000 border-dashed border-2">
                            <div className="w-24 h-24 bg-primary-100 rounded-[2rem] flex items-center justify-center mb-8 relative">
                                <SearchIcon size={40} className="text-primary-600" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                                    <Plus size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Ready for expansion?</h3>
                            <p className="text-secondary-500 max-w-sm mx-auto font-medium leading-relaxed">
                                Search your existing leads or find new prospects using the filters on the left.
                            </p>
                        </div>
                    ) : isSearching ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-primary-600" size={40} />
                                    {searchSource === 'database' ? (
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Searching database...</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                                {searchSource === 'ai' ? 'AI Search in progress...' : 'Finding Prospects...'}
                                            </p>
                                            <p className="text-xs text-secondary-400 font-medium max-w-xs text-center">
                                                {scrapingProgress || 'Searching prospects via Apify. This may take a few minutes.'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="glass-card flex flex-col items-center justify-center text-center p-16">
                            <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-6">
                                <Target size={36} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Search Error</h3>
                            <p className="text-secondary-500 max-w-md font-medium">{error}</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="glass-card flex flex-col items-center justify-center text-center p-16">
                            <div className="w-20 h-20 bg-secondary-100 rounded-[2rem] flex items-center justify-center mb-6">
                                <SearchIcon size={36} className="text-secondary-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No results found</h3>
                            <p className="text-secondary-500 max-w-md font-medium">
                                Try adjusting your search filters to find new prospects.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 glass-card gap-4">
                                <div className="flex items-center gap-8">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Results Found</span>
                                        <p className="text-xl font-black text-slate-900">{results.length} Matches</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleExport}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-secondary-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-secondary-50 transition-all flex items-center gap-2"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {results.map((result, idx) => (
                                    <ResultCard
                                        key={result.id}
                                        result={result}
                                        delay={idx * 100}
                                        onViewPipeline={(path) => router.push(path)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Reusable components ---

function FilterSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="card p-5 shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest flex items-center gap-2">
                    {icon} {title}
                </span>
                <ChevronDown size={14} className={`text-secondary-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="mt-4">{children}</div>}
        </div>
    );
}

function FilterInput({ label, placeholder, icon, value, onChange }: { label: string; placeholder: string; icon: React.ReactNode; value: string; onChange: (v: string) => void }) {
    return (
        <div className="group">
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5 flex items-center gap-2 group-focus-within:text-primary-600 transition-colors">
                {icon} {label}
            </label>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-field"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div>
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5 block">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-field appearance-none cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function MultiSelectField({ label, selected, onChange, options }: { label: string; selected: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const available = options.filter(opt => opt.value && !selected.includes(opt.value));

    // Recalculate position every time the dropdown opens or selection changes
    useEffect(() => {
        if (!isOpen || !btnRef.current) return;
        const update = () => {
            const rect = btnRef.current!.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: Event) => {
            const target = e.target as Node;
            if (
                btnRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const toggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const getLabel = (value: string) => options.find(o => o.value === value)?.label ?? value;

    return (
        <div>
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5 block">{label}</label>
            {/* Selected tags */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selected.map(val => (
                        <span key={val} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-bold border border-primary-100">
                            {getLabel(val)}
                            <button onClick={() => toggle(val)} className="hover:text-red-500 transition-colors">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {/* Dropdown trigger */}
            <button
                ref={btnRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="input-field w-full text-left flex items-center justify-between cursor-pointer"
            >
                <span className="text-secondary-400 text-xs">
                    {selected.length > 0 ? `${selected.length} selected` : 'Select...'}
                </span>
                <ChevronDown size={14} className={`text-secondary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown rendered via portal on document.body — escapes all overflow parents */}
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="bg-white border border-secondary-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto"
                    style={{ position: 'fixed', zIndex: 9999, top: pos.top, left: pos.left, width: pos.width }}
                >
                    {available.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-secondary-400">All options selected</div>
                    ) : (
                        available.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggle(opt.value)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}

function TagInput({ label, placeholder, tags, onChange }: { label: string; placeholder: string; tags: string[]; onChange: (tags: string[]) => void }) {
    const [input, setInput] = useState('');

    const addTag = useCallback(() => {
        const trimmed = input.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
    }, [input, tags, onChange]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
        if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (idx: number) => {
        onChange(tags.filter((_, i) => i !== idx));
    };

    return (
        <div>
            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1.5 block">{label}</label>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100">
                            {tag}
                            <button onClick={() => removeTag(idx)} className="hover:text-red-500 transition-colors">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-field flex-1"
                />
                <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-secondary-100 rounded-xl text-secondary-600 hover:bg-secondary-200 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
}

function ResultCard({ result, delay, onViewPipeline }: { result: Lead; delay: number; onViewPipeline: (path: string) => void }) {
    return (
        <div
            className="card p-6 md:p-8 group animate-in slide-in-from-bottom-4 relative overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-secondary-50 to-secondary-200 rounded-[2rem] flex items-center justify-center text-secondary-700 text-3xl font-black group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 border border-white/50 shadow-inner">
                            {(result.full_name ?? result.first_name ?? '?').charAt(0)}
                        </div>
                        {result.linkedin_url && result.linkedin_url.startsWith('http') && (
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0077b5] border-2 border-white rounded-full flex items-center justify-center text-white shadow-xl" title="LinkedIn Profile">
                                <Linkedin size={14} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-xl font-black text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                                {result.full_name ?? (`${result.first_name ?? ''} ${result.last_name ?? ''}`.trim() || 'Unknown')}
                            </h4>
                            {result.source === 'apify' && (
                                <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-sky-100">
                                    Apify
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                            {result.job_title && (
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Award size={16} className="text-emerald-500" />
                                    <span className="truncate max-w-[200px]">{result.job_title}</span>
                                </span>
                            )}
                            {result.company_name && (
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <Building size={16} className="text-secondary-400" />
                                    <span className="truncate max-w-[200px]">{result.company_name}</span>
                                </span>
                            )}
                            {result.location && (
                                <span className="flex items-center gap-2 text-xs font-medium text-secondary-500">
                                    <MapPin size={16} className="text-secondary-300" />
                                    {result.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-secondary-100">
                    {result.email && (
                        <button
                            onClick={() => onViewPipeline(`/outreach?lead_id=${result.id}`)}
                            className="h-12 px-8 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all hover:shadow-2xl hover:shadow-blue-600/30 flex items-center gap-3 border border-blue-500 group/btn"
                        >
                            Send Email <Send size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}
                    <button
                        onClick={() => onViewPipeline('/leads')}
                        className="h-12 px-8 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-900/30 flex items-center gap-3 border border-slate-700 group/btn"
                    >
                        View in Pipeline <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
