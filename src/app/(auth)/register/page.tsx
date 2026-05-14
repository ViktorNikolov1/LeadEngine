'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await createClient().auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/leads');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
            <div className="card p-10 w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[14px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-600/30 mx-auto mb-4">
                        L
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.createAccount')}</h1>
                    <p className="text-secondary-500 text-sm mt-1">{t('auth.createAccountSubtitle')}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">{t('auth.fullName')}</label>
                        <input
                            type="text"
                            placeholder={t('auth.yourName')}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">{t('common.email')}</label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">{t('common.password')}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : t('auth.createAccount')}
                    </button>
                </form>

                <p className="text-center text-sm text-secondary-500">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                        {t('auth.signIn')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
