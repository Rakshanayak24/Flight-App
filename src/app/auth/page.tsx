'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const supabase = createClient();

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Check your email to confirm your account, then sign in.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleTestLogin = async () => {
    setEmail('test@skyaxis.dev');
    setPassword('Test@1234!');
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@skyaxis.dev',
      password: 'Test@1234!',
    });
    if (error) {
      setError('Test account not set up yet. Create one in Supabase Auth dashboard.');
    } else {
      router.push(redirectTo);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">SkyAxis</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-400 text-sm">
            {mode === 'signin'
              ? 'Sign in to manage your bookings'
              : 'Join SkyAxis to start booking flights'}
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-900/50 rounded-xl">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  className="input pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-slate-600">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <button
              onClick={handleTestLogin}
              disabled={loading}
              className="btn-secondary w-full py-3 text-sm"
            >
              Use Test Account
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Test credentials: test@skyaxis.dev / Test@1234!
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
