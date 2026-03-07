'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Flag, LogOut, Home
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/listings',  label: 'Listings',   icon: Building2 },
  { href: '/admin/users',     label: 'Users',      icon: Users },
  { href: '/admin/reports',   label: 'Reports',    icon: Flag },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout } = useAuthStore();

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

  return (
    <aside className="w-56 flex-shrink-0 bg-navy-950 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-navy-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
            <Home size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-white leading-none">Mazingira</p>
            <p className="text-xs text-navy-400 mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-navy-400 hover:text-white hover:bg-navy-800'
              )}>
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-navy-800 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-400 hover:text-white hover:bg-navy-800 transition-colors">
          <Home size={16} /> View Site
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-400 hover:text-red-400 hover:bg-navy-800 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
