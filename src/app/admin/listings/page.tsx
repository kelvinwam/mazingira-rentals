'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout  from '../../../components/admin/AdminLayout';
import StatusBadge  from '../../../components/admin/StatusBadge';
import { adminAPI } from '../../../lib/api';
import { formatKES, timeAgo } from '../../../lib/utils';
import { Search, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

const STATUSES = ['ALL','PENDING','ACTIVE','REJECTED','SUSPENDED','ARCHIVED'];

function ListingsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [listings, setListings] = useState<any[]>([]);
  const [meta,     setMeta]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState(searchParams.get('q') || '');
  const [status,   setStatus]   = useState(searchParams.get('status') || '');
  const [page,     setPage]     = useState(1);
  const [acting,   setActing]   = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string,any> = { page: p, limit: 15 };
      if (status) params.status = status;
      if (q)      params.q      = q;
      const res = await adminAPI.listings(params);
      setListings(res.data.data);
      setMeta(res.data.meta);
      setPage(p);
    } catch { toast.error('Could not load listings.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, [status]);

  const quickApprove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActing(id);
    try {
      await adminAPI.setListingStatus(id, 'ACTIVE');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'ACTIVE' } : l));
      toast.success('Listing approved!');
    } catch { toast.error('Failed to approve.'); }
    finally  { setActing(null); }
  };

  const quickReject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActing(id);
    try {
      await adminAPI.setListingStatus(id, 'REJECTED');
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
      toast.success('Listing rejected.');
    } catch { toast.error('Failed to reject.'); }
    finally  { setActing(null); }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">Listings</h1>
        <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">
          {meta ? `${meta.total} total listings` : '…'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search by title, landlord name or phone…"
            className="input pl-9 w-full" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s === 'ALL' ? '' : s)}
              className={cn('px-3 py-2 rounded-xl text-xs font-semibold font-display border transition-all',
                (status === s || (s === 'ALL' && !status))
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={36} className="text-surface-300 dark:text-navy-700 mx-auto mb-3" />
            <p className="text-navy-500 dark:text-navy-400">No listings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 dark:border-navy-800">
                  {['Listing','Landlord','Price','Status','Date','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-navy-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50 dark:divide-navy-800">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-surface-25 dark:hover:bg-navy-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
                          {l.primary_image
                            ? <img src={l.primary_image} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Building2 size={14} className="text-navy-400" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-navy-900 dark:text-white truncate max-w-[200px]">{l.title}</p>
                          <p className="text-xs text-navy-400 truncate">{l.area_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-navy-700 dark:text-navy-300">{l.landlord_name || '—'}</p>
                      <p className="text-xs text-navy-400">{l.landlord_phone}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy-900 dark:text-white">{formatKES(l.price_kes)}</td>
                    <td className="px-4 py-3"><StatusBadge value={l.status} /></td>
                    <td className="px-4 py-3 text-navy-400 text-xs">{timeAgo(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/listings/${l.id}`}
                          className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          title="View details">
                          <Eye size={13} />
                        </Link>
                        {l.status === 'PENDING' && (
                          <>
                            <button onClick={e => quickApprove(l.id, e)} disabled={acting === l.id}
                              className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              title="Approve">
                              {acting === l.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                            </button>
                            <button onClick={e => quickReject(l.id, e)} disabled={acting === l.id}
                              className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                              title="Reject">
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

export default function AdminListingsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>}>
        <ListingsContent />
      </Suspense>
    </AdminLayout>
  );
}
