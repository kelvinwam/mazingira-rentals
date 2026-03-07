'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout  from '../../../components/admin/AdminLayout';
import { adminAPI } from '../../../lib/api';
import { timeAgo, cn } from '../../../lib/utils';
import { Flag, CheckCircle, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const REASON_LABELS: Record<string, string> = {
  FAKE_LISTING:    'Fake Listing',
  WRONG_PRICE:     'Wrong Price',
  ALREADY_RENTED:  'Already Rented',
  WRONG_LOCATION:  'Wrong Location',
  INAPPROPRIATE:   'Inappropriate Content',
  SCAM:            'Potential Scam',
  OTHER:           'Other',
};

function ReportsContent() {
  const searchParams = useSearchParams();
  const [reports,  setReports]  = useState<any[]>([]);
  const [meta,     setMeta]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState(searchParams.get('resolved') === 'false' ? 'open' : 'all');
  const [page,     setPage]     = useState(1);
  const [acting,   setActing]   = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string,any> = { page: p, limit: 15 };
      if (filter === 'open')     params.resolved = false;
      if (filter === 'resolved') params.resolved = true;
      const res = await adminAPI.reports(params);
      setReports(res.data.data);
      setMeta(res.data.meta);
      setPage(p);
    } catch { toast.error('Could not load reports.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, [filter]);

  const resolve = async (id: string) => {
    setActing(id);
    try {
      await adminAPI.resolveReport(id);
      setReports(prev => prev.map(r => r.id === id ? { ...r, is_resolved: true } : r));
      toast.success('Report marked as resolved.');
    } catch { toast.error('Failed.'); }
    finally  { setActing(null); }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">Reports</h1>
        <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">
          {meta ? `${meta.total} total reports` : '…'}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all',      label: 'All Reports' },
          { key: 'open',     label: 'Open'        },
          { key: 'resolved', label: 'Resolved'    },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold font-display border transition-all',
              filter === key
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <Flag size={36} className="text-surface-300 dark:text-navy-700 mx-auto mb-3" />
            <p className="text-navy-500 dark:text-navy-400">No reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50 dark:divide-navy-800">
            {reports.map(r => (
              <div key={r.id}
                className={cn('p-5 flex flex-col sm:flex-row gap-4 sm:items-start',
                  !r.is_resolved && 'bg-red-50/40 dark:bg-red-900/5')}>

                {/* Icon */}
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  r.is_resolved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
                  <Flag size={16} className={r.is_resolved ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                      r.is_resolved
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                    {r.is_resolved && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={11} /> Resolved {r.resolved_by_name && `by ${r.resolved_by_name}`}
                      </span>
                    )}
                  </div>

                  <p className="font-medium text-sm text-navy-900 dark:text-white mb-0.5">
                    {r.apartment_title}
                  </p>

                  {r.details && (
                    <p className="text-sm text-navy-500 dark:text-navy-400 mb-1">{r.details}</p>
                  )}

                  <p className="text-xs text-navy-400">
                    Reported by {r.reporter_name || 'Anonymous'} · {timeAgo(r.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/listings/${r.apartment_id}`}
                    className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    title="View listing">
                    <Eye size={14} />
                  </Link>
                  {!r.is_resolved && (
                    <button onClick={() => resolve(r.id)} disabled={acting === r.id}
                      className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      title="Mark as resolved">
                      {acting === r.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <CheckCircle size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
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

export default function AdminReportsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>}>
        <ReportsContent />
      </Suspense>
    </AdminLayout>
  );
}
