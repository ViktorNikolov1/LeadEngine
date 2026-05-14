'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Search, Database, Settings, LogOut, ChevronRight, Menu, X, Zap, Send, Clock, Sun, Moon, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { LOCALE_LABELS, LOCALE_FLAGS, type Locale } from '@/lib/i18n';

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggle: toggleTheme } = useTheme();
    const { locale, setLocale, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [userName, setUserName] = useState('');
    const [userInitial, setUserInitial] = useState('U');

    useEffect(() => {
        async function loadUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
                setUserName(name);
                setUserInitial(name.charAt(0).toUpperCase());
            }
        }
        loadUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                onClick={() => setIsOpen(false)}
                className={isActive ? "nav-link-active" : "nav-link"}
            >
                {icon}
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-primary-400" />}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900 z-[60] flex items-center justify-between px-6 border-b border-secondary-200/60 dark:border-slate-700/60 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary-500/20">L</div>
                    <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">LeadEngine</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Desktop & Mobile */}
            <aside className={`
        fixed inset-y-0 left-0 w-72 h-full glass-panel z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col bg-white/95 dark:bg-slate-900
      `}>
                <div className="p-8 pt-10">
                    <div className="flex items-center gap-4 px-2 mb-10 group cursor-default">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[14px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-600/30 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                            L
                        </div>
                        <div>
                            <span className="text-[22px] font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">LeadEngine</span>
                            <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-[0.2em] uppercase mt-1">Production v1.0</p>
                        </div>
                    </div>

                    <nav className="space-y-1.5">
                        <NavLink href="/" icon={<Home size={20} />} label={t('sidebar.dashboard')} />
                        <NavLink href="/search" icon={<Search size={20} />} label={t('sidebar.advancedSearch')} />
                        <NavLink href="/campaigns" icon={<Database size={20} />} label={t('sidebar.campaigns')} />
                        <NavLink href="/leads" icon={<Users size={20} />} label={t('sidebar.leadPipeline')} />
                        <NavLink href="/outreach" icon={<Send size={20} />} label={t('sidebar.emailOutreach')} />
                        <NavLink href="/logs" icon={<Clock size={20} />} label={t('sidebar.jobLogs')} />
                        <NavLink href="/settings" icon={<Settings size={20} />} label={t('sidebar.settings')} />
                    </nav>

                    {/* Engine Status */}
                    <div className="mt-10 p-4 rounded-xl bg-secondary-50 dark:bg-slate-800 border border-secondary-200/60 dark:border-slate-700/60 shadow-sm relative overflow-hidden group/status">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-3 relative">
                            <span className="text-[10px] font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-widest">{t('sidebar.scrapingEngine')}</span>
                            <span className="flex h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                        </div>
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-200 relative">
                            <Zap size={15} className="text-primary-500" fill="currentColor" />
                            <span>{t('sidebar.engineActive')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-secondary-200/50 dark:border-slate-700 bg-secondary-50/50 dark:bg-slate-800">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-secondary-200/60 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 transition-all text-left group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-secondary-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {theme === 'dark'
                                ? <Sun size={18} className="text-amber-400" />
                                : <Moon size={18} className="text-slate-500" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                {theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}
                            </span>
                        </div>
                    </button>

                    {/* Language Switcher */}
                    <div className="relative mb-4">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-secondary-200/60 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 transition-all text-left group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-secondary-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Globe size={18} className="text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                    {LOCALE_FLAGS[locale]} &middot; {LOCALE_LABELS[locale]}
                                </span>
                            </div>
                        </button>
                        {showLangMenu && (
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border border-secondary-200 dark:border-slate-600 rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
                                {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
                                    <button
                                        key={loc}
                                        onClick={() => { setLocale(loc); setShowLangMenu(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest hover:bg-secondary-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${locale === loc ? 'text-primary-600 bg-primary-50 dark:bg-primary-500/10' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <span className="font-black">{LOCALE_FLAGS[loc]}</span>
                                        {LOCALE_LABELS[loc]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 p-3 mb-4 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-secondary-200/60 dark:hover:border-slate-600">
                        <div className="w-10 h-10 rounded-[12px] bg-white dark:bg-slate-700 border border-secondary-200 dark:border-slate-500 flex items-center justify-center text-slate-700 dark:text-white font-bold text-lg shadow-sm group-hover:shadow group-hover:-translate-y-0.5 transition-all">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate">{userName || 'Loading...'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-secondary-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all duration-300 text-[12px] font-bold uppercase tracking-wider border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                    >
                        <LogOut size={16} />
                        <span>{t('sidebar.terminateSession')}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                ></div>
            )}
        </>
    );
}
