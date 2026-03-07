'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout  from '../../../../components/admin/AdminLayout';
import StatusBadge  from '../../../../components/admin/StatusBadge';
import { adminAPI } from '../../../../lib/api';
import { formatKES, timeAgo } from '../../../../lib/utils';
import { ArrowLeft, Loader2, Phone, UserX, UserCheck, Building2, Eye } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminUserDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  useEffect(() => {
    adminAPI.getUser(id)
      .then(r => setUser(r.data.data))
      .catch(() => { toast.error('User not found.'); router.push('/admin/users'); })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStatus = async () => {
    setActing(true);
    try {
      await adminAPI.setUserStatus(id, !user.is_active);
      setUser((prev: any) => ({ ...prev, is_active: !prev.is_active }));
      toast.success(user.is_active ? 'User suspended.' : 'User reactivated.');
    } catch { toast.error('Failed.'); }
    finally  { setActing(false); }
  };

  const changeRole = async (role: string) => {
    if (!confirm(`Change this user's role to ${role}?`)) return;
    setActing(true);
    try {
      await adminAPI.setUserRole(id, role);
      setUser((prev: any) => ({ ...prev, role }));
      toast.success(`Role changed to ${role}.`);
    } catch { toast.error('Failed.'); }
    finally  { setActing(false); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-amber-500" /></div>
    </AdminLayout>
  );

  if (!user) return null;

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        <Link href="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 transition-colors mb-6 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to users
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — user info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Profile card */}
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-xl text-amber-600 dark:text-amber-400">
                    {user.full_name?.[0]?.toUpperCase() || user.phone[3]}
                  </span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-navy-900 dark:text-white">
                    {user.full_name || 'No name set'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge value={user.role} />
                    <StatusBadge value={user.is_active} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-navy-400 text-xs mb-1">Phone</p>
                  <p className="text-navy-800 dark:text-navy-200 flex items-center gap-1.5">
                    <Phone size={13} className="text-amber-500" /> {user.phone}
                  </p>
                </div>
                {user.email && (
                  <div>
                    <p className="text-navy-400 text-xs mb-1">Email</p>
                    <p className="text-navy-800 dark:text-navy-200">{user.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-navy-400 text-xs mb-1">Joined</p>
                  <p className="text-navy-800 dark:text-navy-200">{timeAgo(user.created_at)}</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-1">Listings</p>
                  <p className="text-navy-800 dark:text-navy-200">{user.listing_count || 0}</p>
                </div>
              </div>
            </div>

            {/* Listings */}
            {user.listings?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">
                  Listings ({user.listings.length})
                </h3>
                <div className="space-y-2">
                  {user.listings.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-navy-800 rounded-xl">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-navy-900 dark:text-white truncate">{l.title}</p>
                        <p className="text-xs text-navy-400">{l.area_name} · {formatKES(l.price_kes)}/mo · {timeAgo(l.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <StatusBadge value={l.status} />
                        <Link href={`/admin/listings/${l.id}`}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-navy-700 flex items-center justify-center text-navy-500 hover:text-amber-600 transition-colors">
                          <Eye size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — actions */}
          <div className="space-y-4">

            {/* Account status */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">Account Status</h3>
              <button onClick={toggleStatus} disabled={acting}
                className={cn('w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold font-display transition-all disabled:opacity-50',
                  user.is_active
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-100'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600')}>
                {acting
                  ? <Loader2 size={15} className="animate-spin" />
                  : user.is_active
                    ? <><UserX size={15} /> Suspend User</>
                    : <><UserCheck size={15} /> Reactivate User</>}
              </button>
            </div>

            {/* Role */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">
                Role: <StatusBadge value={user.role} className="ml-1" />
              </h3>
              <div className="space-y-2">
                {['TENANT','LANDLORD'].map(r => (
                  <button key={r} onClick={() => changeRole(r)}
                    disabled={acting || user.role === r}
                    className={cn('w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all',
                      user.role === r
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400 disabled:opacity-40')}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* View their listings on site */}
            {user.role === 'LANDLORD' && (
              <Link href={`/listings?landlord=${id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-surface-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:border-amber-400 transition-colors card">
                <Building2 size={14} /> View Public Listings
              </Link>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
