'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import DotGrid from '@/components/ui/DotGrid';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/leads');
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-secondary-50">
            {/* Animated dot grid background */}
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

            {/* Login card — floats above the dot grid */}
            <div className="relative z-10 card p-10 w-full max-w-md space-y-6 backdrop-blur-sm bg-white/90">
                <div className="text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[14px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary-600/30 mx-auto mb-4">
                        L
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-secondary-500 text-sm mt-1">Sign in to your LeadEngine account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
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
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-secondary-400">
                    Access is restricted to authorized users only.
                </p>
            </div>
        </div>
    );
}
