'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plane, Menu, X, User, LogOut, TicketCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore, useFlightStore } from '@/store';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useUserStore((s) => s.clearSession);
  const resetAll = useFlightStore((s) => s.resetAll);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSession();
    resetAll();
    router.push('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Search Flights' },
    { href: '/my-bookings', label: 'My Bookings' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center group-hover:bg-sky-400 transition-colors">
            <Plane className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">SkyAxis</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === link.href
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          {userEmail ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-sm text-slate-300">
                <User className="w-4 h-4" />
                <span className="max-w-[160px] truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 btn-ghost text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/auth" className="btn-primary py-2 text-sm">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-strong border-t border-white/8 px-4 py-4 flex flex-col gap-2 animate-slide-down">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2',
                pathname === link.href
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {link.href === '/my-bookings' && <TicketCheck className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/8 pt-2 mt-1">
            {userEmail ? (
              <>
                <p className="px-4 py-2 text-sm text-slate-400 truncate">{userEmail}</p>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMenuOpen(false)}
                className="block btn-primary text-center text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
