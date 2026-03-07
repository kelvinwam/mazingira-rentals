'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout  from '../../../components/admin/AdminLayout';
import StatusBadge  from '../../../components/admin/StatusBadge';
import { adminAPI } from '../../..//lib/api';
import { timeAgo, cn } from '../../../lib/utils';
import { Search, ChevronLeft, ChevronRight, Eye, UserX, UserCheck, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['ALL','TENANT','LANDLORD'];

function UsersContent() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [meta,    setMeta]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [role,    setRole]    = useState('');
  const [page,    setPage]    = useState(1);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string,any> = { page: p, limit: 15 };
      if (role) params.role = role;
      if (q)    params.q    = q;
      const res = await adminAPI.users(params);
      setUsers(res.data.data);
      setMeta(res.data.meta);
      setPage(p);
    } catch { toast.error('Could not load users.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, [role]);

  const toggleStatus = async (user: any) => {
    setActing(user.id);
    try {
      await adminAPI.setUserStatus(user.id, !user.is_active);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(user.is_active ? 'User suspended.' : 'User reactivated.');
    } catch { toast.error('Failed to update user.'); }
    finally  { setActing(null); }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">Users</h1>
        <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">{meta ? `${meta.total} registered users` : '…'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search by name or phone…"
            className="input pl-9 w-full" />
        </div>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r === 'ALL' ? '' : r)}
              className={cn('px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                (role === r || (r === 'ALL' && !role))
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="text-surface-300 dark:text-navy-700 mx-auto mb-3" />
            <p className="text-navy-500 dark:text-navy-400">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-navy-800">
                  {['User','Phone','Role','Status','Listings','Joined','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-navy-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-navy-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-surface-25 dark:hover:bg-navy-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-amber-600 font-display">
                            {u.full_name?.[0]?.toUpperCase() || u.phone[3]}
                          </span>
                        </div>
                        <span className="font-medium text-navy-900 dark:text-white">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-500 dark:text-navy-400">{u.phone}</td>
                    <td className="px-4 py-3"><StatusBadge value={u.role} /></td>
                    <td className="px-4 py-3"><StatusBadge value={u.is_active} /></td>
                    <td className="px-4 py-3 text-center text-navy-700 dark:text-navy-300">{u.listing_count || 0}</td>
                    <td className="px-4 py-3 text-navy-400 text-xs">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/users/${u.id}`}
                          className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <Eye size={13} />
                        </Link>
                        <button onClick={() => toggleStatus(u)} disabled={acting === u.id}
                          className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50',
                            u.is_active
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100')}
                          title={u.is_active ? 'Suspend user' : 'Reactivate user'}>
                          {acting === u.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-navy-800">
            <p className="text-xs text-navy-400">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1}
                className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 disabled:opacity-40 hover:bg-surface-200 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => load(page + 1)} disabled={page >= meta.totalPages}
                className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 disabled:opacity-40 hover:bg-surface-200 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>}>
        <UsersContent />
      </Suspense>
    </AdminLayout>
  );
}
