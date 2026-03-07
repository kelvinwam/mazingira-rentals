'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import StatsCard   from '../../../components/landlord/StatsCard';
import { adminAPI } from '../../../lib/api';
import { Building2, Users, Flag, MessageSquare, Star, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface Stats {
  listings: { total: string; active: string; pending: string; rejected: string; suspended: string; new_this_week: string };
  users:    { total: string; tenants: string; landlords: string; suspended: string; new_this_week: string };
  reports:  { total: string; pending: string };
  reviews:  number;
  messages: number;
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.stats()
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Could not load stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">Dashboard</h1>
          <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">Overview of the entire platform</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={Building2}    label="Total Listings"
            value={stats?.listings.total || 0}
            sub={`${stats?.listings.new_this_week || 0} new this week`}
            color="text-amber-500" loading={loading} />
          <StatsCard icon={Users}        label="Registered Users"
            value={stats?.users.total || 0}
            sub={`${stats?.users.new_this_week || 0} new this week`}
            color="text-blue-500" loading={loading} />
          <StatsCard icon={Flag}         label="Open Reports"
            value={stats?.reports.pending || 0}
            sub={`${stats?.reports.total || 0} total reports`}
            color="text-red-500" loading={loading} />
          <StatsCard icon={MessageSquare}label="Messages"
            value={stats?.messages || 0}
            color="text-purple-500" loading={loading} />
        </div>

        {/* Listing breakdown + user breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Listings breakdown */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Listings by Status</h2>
              <Link href="/admin/listings" className="text-xs text-amber-600 font-semibold hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Active',    key: 'active',    icon: CheckCircle, color: 'text-emerald-500' },
                { label: 'Pending',   key: 'pending',   icon: Clock,       color: 'text-amber-500'   },
                { label: 'Rejected',  key: 'rejected',  icon: XCircle,     color: 'text-red-500'     },
                { label: 'Suspended', key: 'suspended', icon: XCircle,     color: 'text-orange-500'  },
              ].map(({ label, key, icon: Icon, color }) => {
                const val   = parseInt(stats?.listings[key as keyof typeof stats.listings] as string || '0');
                const total = parseInt(stats?.listings.total as string || '1');
                const pct   = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon size={14} className={color} />
                    <span className="text-sm text-navy-700 dark:text-navy-300 w-20">{label}</span>
                    <div className="flex-1 h-2 bg-surface-100 dark:bg-navy-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', {
                        'bg-emerald-500': key === 'active',
                        'bg-amber-500':   key === 'pending',
                        'bg-red-500':     key === 'rejected',
                        'bg-orange-500':  key === 'suspended',
                      })} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-navy-900 dark:text-white w-8 text-right">{val}</span>
                  </div>
                );
              })}
            </div>
            {stats?.listings.pending && parseInt(stats.listings.pending) > 0 && (
              <Link href="/admin/listings?status=PENDING"
                className="mt-5 flex items-center justify-center gap-2 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                <Clock size={14} />
                Review {stats.listings.pending} pending listing{parseInt(stats.listings.pending) !== 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {/* Users breakdown */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Users by Role</h2>
              <Link href="/admin/users" className="text-xs text-amber-600 font-semibold hover:underline">View all</Link>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Tenants',   key: 'tenants',   color: 'bg-purple-500' },
                { label: 'Landlords', key: 'landlords', color: 'bg-blue-500'   },
                { label: 'Suspended', key: 'suspended', color: 'bg-red-500'    },
              ].map(({ label, key, color }) => {
                const val   = parseInt(stats?.users[key as keyof typeof stats.users] as string || '0');
                const total = parseInt(stats?.users.total as string || '1');
                const pct   = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', color)} />
                    <span className="text-sm text-navy-700 dark:text-navy-300 w-20">{label}</span>
                    <div className="flex-1 h-2 bg-surface-100 dark:bg-navy-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-navy-900 dark:text-white w-8 text-right">{val}</span>
                  </div>
                );
              })}
            </div>

            {stats?.reports.pending && parseInt(stats.reports.pending) > 0 && (
              <Link href="/admin/reports"
                className="mt-5 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <Flag size={14} />
                {stats.reports.pending} unresolved report{parseInt(stats.reports.pending) !== 1 ? 's' : ''} need attention
              </Link>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending Listings', href: '/admin/listings?status=PENDING', icon: Clock,       color: 'text-amber-500  bg-amber-50  dark:bg-amber-900/20'  },
              { label: 'All Users',        href: '/admin/users',                   icon: Users,       color: 'text-blue-500   bg-blue-50   dark:bg-blue-900/20'   },
              { label: 'Open Reports',     href: '/admin/reports?resolved=false',  icon: Flag,        color: 'text-red-500    bg-red-50    dark:bg-red-900/20'    },
              { label: 'All Listings',     href: '/admin/listings',                icon: Building2,   color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href}
                className={cn('flex flex-col items-center gap-2 p-4 rounded-xl text-center hover:opacity-80 transition-opacity', color.split(' ').slice(1).join(' '))}>
                <Icon size={20} className={color.split(' ')[0]} />
                <span className="text-xs font-semibold text-navy-700 dark:text-navy-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
