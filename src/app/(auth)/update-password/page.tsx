'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import DotGrid from '@/components/ui/DotGrid';

export default function UpdatePasswordPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(t('auth.passwordMinLength'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordsNoMatch'));
            return;
        }

        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/leads');
            }, 2000);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-secondary-50">
            <div className="absolute inset-0 z-0">
                <DotGrid
                    dotSize={5}
                    gap={15}
                    baseColor="#c7d2fe"
                    activeColor="#6366f1"
                    proximity={120}
                    shockRadius={250}
                    shockStrength={5}
                    resistance={750}
                    returnDuration={1.5}
                />
            </div>

            <div className="relative z-10 card p-10 w-full max-w-md space-y-6 backdrop-blur-sm bg-white/90">
                <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[14px] flex items-center justify-center text-white shadow-lg shadow-primary-600/30 mx-auto mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.setNewPassword')}</h1>
                    <p className="text-secondary-500 text-sm mt-1">{t('auth.enterNewPassword')}</p>
                </div>

                {success ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium text-center">
                        {t('auth.passwordUpdated')}
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">{t('auth.newPassword')}</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">{t('auth.confirmPassword')}</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : t('auth.updatePassword')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
