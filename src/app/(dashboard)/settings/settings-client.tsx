'use client';

import { useState } from 'react';
import { Save, User, Bell, Mail, Shield, AlertCircle, Loader2, Check } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';

export default function SettingsClient({ displayName, email, userId }: { displayName: string; email: string; userId: string }) {
    const { t } = useLanguage();
    const [name, setName] = useState(displayName);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [resetSending, setResetSending] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [error, setError] = useState('');

    const handleSaveProfile = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/settings/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name }),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? t('settings.failedSave'));
            } else {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch {
            setError(t('settings.failedSaveProfile'));
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        setResetSending(true);
        setError('');
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            });
            if (error) {
                setError(error.message);
            } else {
                setResetSent(true);
                setTimeout(() => setResetSent(false), 5000);
            }
        } catch {
            setError(t('settings.failedSendReset'));
        } finally {
            setResetSending(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-8 mx-auto animate-in fade-in duration-700">
            <header className="pb-4 border-b border-secondary-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('settings.title')}</h2>
                <p className="text-secondary-500">{t('settings.subtitle')}</p>
            </header>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                    {error}
                </div>
            )}

            {/* Profile Section */}
            <div className="card p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{t('settings.profileInfo')}</h3>
                        <p className="text-sm text-secondary-500">{t('settings.updateDetails')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="text-sm font-medium text-slate-700 mb-2 block group-focus-within:text-primary-600 transition-colors">
                            {t('settings.fullName')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm placeholder:text-secondary-400"
                        />
                    </div>

                    <div className="group">
                        <label className="text-sm font-medium text-slate-700 mb-2 block group-focus-within:text-primary-600 transition-colors">
                            {t('settings.emailAddress')}
                        </label>
                        <input
                            type="email"
                            defaultValue={email}
                            disabled
                            className="w-full bg-secondary-100 border border-secondary-200 rounded-lg p-3 text-secondary-500 cursor-not-allowed outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving || name === displayName}
                        className="flex items-center gap-2 px-6 py-2.5 btn-primary rounded-lg font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : saved ? <Check size={16} /> : <Save size={16} />}
                        {saved ? t('settings.saved') : t('settings.saveProfile')}
                    </button>
                </div>
            </div>

            {/* Security Section */}
            <div className="card p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{t('settings.security')}</h3>
                        <p className="text-sm text-secondary-500">{t('settings.securitySubtitle')}</p>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">{t('settings.securePasswordChange')}</p>
                        <p className="text-blue-700 leading-relaxed">
                            {t('settings.securePasswordDesc')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handlePasswordReset}
                    disabled={resetSending || resetSent}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-secondary-200 text-slate-700 font-medium rounded-lg hover:bg-secondary-50 hover:text-slate-900 transition-all shadow-sm disabled:opacity-50"
                >
                    {resetSending ? <Loader2 className="animate-spin" size={16} /> : resetSent ? <Check size={16} className="text-green-600" /> : <Mail size={16} />}
                    {resetSent ? t('settings.resetEmailSent') : t('settings.sendPasswordReset')}
                </button>
            </div>

            {/* Notifications Section */}
            <div className="card p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{t('settings.notifications')}</h3>
                        <p className="text-sm text-secondary-500">{t('settings.notificationsSubtitle')}</p>
                    </div>
                </div>

                <div className="space-y-4 text-sm font-medium">
                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                        <span>{t('settings.campaignUpdates')}</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-100">
                        <span>{t('settings.leadAlerts')}</span>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>
            </div>
        </div>
    );
}
