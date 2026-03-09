'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home, Menu, X, Moon, Sun, User, LogOut,
  LayoutDashboard, Building2, ChevronDown,
  MessageSquare, Heart, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore }   from '../../store/uiStore';
import { authAPI }      from '../../lib/api';
import { cn }           from '../../lib/utils';
import toast            from 'react-hot-toast';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { dark, toggleDark } = useUIStore();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  const isHero = pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('maz_refresh');
      if (refresh) await authAPI.logout(refresh).catch(() => {});
    } finally {
      logout();
      toast.success('Logged out.');
      router.push('/');
    }
  };

  const navBg = isHero && !scrolled
    ? 'bg-transparent'
    : 'bg-white/95 dark:bg-navy-950/95 backdrop-blur-xl shadow-sm border-b border-surface-100 dark:border-navy-800';

  return (
    <>
      <nav className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-300', navBg)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
              <Home size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className={cn('font-display font-bold text-lg transition-colors',
              isHero && !scrolled ? 'text-white' : 'text-navy-900 dark:text-white')}>
              MachaRent
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/listings"
              className={cn('px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                isHero && !scrolled
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-navy-800')}>
              Browse
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button onClick={toggleDark}
              className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                isHero && !scrolled
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-navy-500 dark:text-navy-400 hover:bg-surface-100 dark:hover:bg-navy-800')}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Authenticated user menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
                    isHero && !scrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-navy-700 dark:text-navy-300 hover:bg-surface-100 dark:hover:bg-navy-800')}>
                  <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold font-display">
                      {user.full_name?.[0]?.toUpperCase() || user.phone[3]}
                    </span>
                  </div>
                  <span className="hidden sm:block">{user.full_name?.split(' ')[0] || 'Account'}</span>
                  <ChevronDown size={14} className={cn('transition-transform', profileOpen && 'rotate-180')} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 card py-1.5 shadow-card-hover z-50">
                    <div className="px-4 py-2.5 border-b border-surface-100 dark:border-navy-800">
                      <p className="font-semibold text-sm text-navy-900 dark:text-white truncate">
                        {user.full_name || 'No name set'}
                      </p>
                      <p className="text-xs text-navy-400 capitalize">{user.role.toLowerCase()}</p>
                    </div>

                    {user.role === 'LANDLORD' && (
                      <>
                        <Link href="/landlord/dashboard" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                          <LayoutDashboard size={15} className="text-amber-500" /> Dashboard
                        </Link>
                        <Link href="/landlord/analytics" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                          <TrendingUp size={15} className="text-amber-500" /> Analytics
                        </Link>
                      </>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                        <LayoutDashboard size={15} className="text-amber-500" /> Admin Panel
                      </Link>
                    )}
                    <Link href="/messages" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                      <MessageSquare size={15} className="text-navy-400" /> Messages
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                      <Heart size={15} className="text-navy-400" /> My Wishlist
                    </Link>

                    <div className="border-t border-surface-100 dark:border-navy-800 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={cn('md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                isHero && !scrolled
                  ? 'text-white/80 hover:bg-white/10'
                  : 'text-navy-700 dark:text-navy-300 hover:bg-surface-100 dark:hover:bg-navy-800')}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-navy-900 border-b border-surface-100 dark:border-navy-800 p-4 space-y-2">
            <Link href="/listings" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800">
              <Building2 size={16} className="text-amber-500" /> Browse Listings
            </Link>
            {isAuthenticated && user?.role === 'LANDLORD' && (
              <>
                <Link href="/landlord/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800">
                  <LayoutDashboard size={16} className="text-amber-500" /> Dashboard
                </Link>
                <Link href="/landlord/analytics" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800">
                  <TrendingUp size={16} className="text-amber-500" /> Analytics
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={16} /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}
