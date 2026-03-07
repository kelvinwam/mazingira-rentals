'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout  from '../../../../components/admin/AdminLayout';
import StatusBadge  from '../../../../components/admin/StatusBadge';
import { adminAPI } from '../../../../lib/api';
import { formatKES, timeAgo } from '../../../../lib/utils';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, ShieldCheck,
  Star, Trash2, MapPin, Phone, Zap, ZapOff, Eye
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import toast from 'react-hot-toast';

const STATUS_ACTIONS = [
  { value: 'ACTIVE',    label: 'Approve',   color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { value: 'REJECTED',  label: 'Reject',    color: 'bg-red-500 hover:bg-red-600 text-white'         },
  { value: 'SUSPENDED', label: 'Suspend',   color: 'bg-orange-500 hover:bg-orange-600 text-white'   },
  { value: 'ARCHIVED',  label: 'Archive',   color: 'bg-navy-500 hover:bg-navy-600 text-white'       },
  { value: 'PENDING',   label: '→ Pending', color: 'bg-amber-500 hover:bg-amber-600 text-white'     },
];

const VERIFY_LEVELS = [
  { value: 'UNVERIFIED',         label: 'Unverified'        },
  { value: 'PHONE_VERIFIED',     label: 'Phone Verified'    },
  { value: 'IN_PERSON_VERIFIED', label: 'In-Person Verified'},
];

export default function AdminListingDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [listing, setListing]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [imgIdx,  setImgIdx]    = useState(0);
  const [note,    setNote]      = useState('');
  const [acting,  setActing]    = useState(false);

  useEffect(() => {
    adminAPI.getListing(id)
      .then(r => { setListing(r.data.data); setNote(r.data.data.admin_note || ''); })
      .catch(() => { toast.error('Listing not found.'); router.push('/admin/listings'); })
      .finally(() => setLoading(false));
  }, [id]);

  const setStatus = async (status: string) => {
    setActing(true);
    try {
      await adminAPI.setListingStatus(id, status, note || undefined);
      setListing((prev: any) => ({ ...prev, status, admin_note: note || prev.admin_note }));
      toast.success(`Listing ${status.toLowerCase()}.`);
    } catch { toast.error('Failed to update status.'); }
    finally  { setActing(false); }
  };

  const setVerification = async (level: string) => {
    setActing(true);
    try {
      await adminAPI.setVerification(id, level);
      setListing((prev: any) => ({ ...prev, verification_level: level }));
      toast.success('Verification updated.');
    } catch { toast.error('Failed.'); }
    finally  { setActing(false); }
  };

  const toggleBoost = async () => {
    setActing(true);
    try {
      const boosted = !listing.is_boosted;
      await adminAPI.setBoost(id, boosted, 30);
      setListing((prev: any) => ({ ...prev, is_boosted: boosted }));
      toast.success(boosted ? 'Listing boosted for 30 days.' : 'Boost removed.');
    } catch { toast.error('Failed.'); }
    finally  { setActing(false); }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await adminAPI.deleteReview(reviewId);
      setListing((prev: any) => ({
        ...prev,
        reviews: prev.reviews.filter((r: any) => r.id !== reviewId),
      }));
      toast.success('Review deleted.');
    } catch { toast.error('Failed to delete review.'); }
  };

  const deleteListing = async () => {
    if (!confirm('Permanently delete this listing? This cannot be undone.')) return;
    setActing(true);
    try {
      await adminAPI.deleteListing(id);
      toast.success('Listing deleted.');
      router.push('/admin/listings');
    } catch { toast.error('Failed to delete.'); }
    finally  { setActing(false); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-amber-500" /></div>
    </AdminLayout>
  );

  if (!listing) return null;

  const imgs = listing.images || [];

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl">
        <Link href="/admin/listings"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 transition-colors mb-6 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — listing preview */}
          <div className="lg:col-span-2 space-y-5">

            {/* Images */}
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-surface-100 dark:bg-navy-800">
                {imgs[imgIdx]?.url
                  ? <Image src={imgs[imgIdx].url} alt="" fill className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-navy-400 text-sm">No photos</div>}
                <div className="absolute top-3 left-3 flex gap-2">
                  <StatusBadge value={listing.status} />
                  {listing.is_boosted && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">Boosted</span>
                  )}
                </div>
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {imgs.map((img: any, i: number) => (
                    <button key={img.id} onClick={() => setImgIdx(i)}
                      className={cn('flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all',
                        i === imgIdx ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100')}>
                      <Image src={img.thumbnail_url || img.url} alt="" width={56} height={56} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-1">{listing.title}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy-500 dark:text-navy-400 mb-3">
                <span className="flex items-center gap-1"><MapPin size={13} className="text-amber-500" />{listing.area_name}</span>
                <span>{formatKES(listing.price_kes)}/mo</span>
                {listing.bedrooms  != null && <span>{listing.bedrooms} bed</span>}
                {listing.bathrooms != null && <span>{listing.bathrooms} bath</span>}
                <span className="flex items-center gap-1"><Eye size={13} />{listing.view_count} views</span>
              </div>
              <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
              {listing.admin_note && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Admin Note</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{listing.admin_note}</p>
                </div>
              )}
            </div>

            {/* Reports */}
            {listing.reports?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">
                  Reports ({listing.reports.length})
                </h3>
                <div className="space-y-3">
                  {listing.reports.map((r: any) => (
                    <div key={r.id} className={cn('p-3 rounded-xl text-sm',
                      r.is_resolved
                        ? 'bg-surface-50 dark:bg-navy-800 text-navy-500'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300')}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{r.reason.replace(/_/g,' ')}</p>
                        <span className="text-xs opacity-70">{timeAgo(r.created_at)}</span>
                      </div>
                      {r.details && <p className="text-xs opacity-80">{r.details}</p>}
                      <p className="text-xs opacity-60 mt-1">By: {r.reporter_name || 'Anonymous'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {listing.reviews?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">
                  Reviews ({listing.reviews.length})
                </h3>
                <div className="space-y-3">
                  {listing.reviews.map((r: any) => (
                    <div key={r.id} className="flex items-start justify-between gap-3 p-3 bg-surface-50 dark:bg-navy-800 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={11} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-300'} />
                            ))}
                          </div>
                          <span className="text-xs text-navy-400">{r.reviewer_name || 'Anonymous'} · {timeAgo(r.created_at)}</span>
                        </div>
                        {r.body && <p className="text-sm text-navy-600 dark:text-navy-300">{r.body}</p>}
                      </div>
                      <button onClick={() => deleteReview(r.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — actions */}
          <div className="space-y-5">

            {/* Landlord */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">Landlord</h3>
              <p className="font-semibold text-navy-800 dark:text-navy-200">{listing.landlord_name || '—'}</p>
              <p className="text-sm text-navy-500 flex items-center gap-1.5 mt-1">
                <Phone size={12} /> {listing.landlord_phone}
              </p>
              <Link href={`/admin/users/${listing.landlord_id}`}
                className="mt-3 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                View User Profile →
              </Link>
            </div>

            {/* Status actions */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">
                Status: <StatusBadge value={listing.status} className="ml-1" />
              </h3>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Optional note to landlord (reason for rejection, etc.)"
                rows={3} className="input text-sm resize-none w-full mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ACTIONS.filter(a => a.value !== listing.status).map(a => (
                  <button key={a.value} onClick={() => setStatus(a.value)} disabled={acting}
                    className={cn('py-2 px-3 rounded-xl text-xs font-semibold font-display transition-all disabled:opacity-50', a.color)}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">
                Verification: <StatusBadge value={listing.verification_level} className="ml-1" />
              </h3>
              <div className="space-y-2">
                {VERIFY_LEVELS.map(v => (
                  <button key={v.value} onClick={() => setVerification(v.value)}
                    disabled={acting || listing.verification_level === v.value}
                    className={cn('w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2',
                      listing.verification_level === v.value
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400 disabled:opacity-40')}>
                    <ShieldCheck size={12} /> {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Boost */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white mb-3">Boost</h3>
              <button onClick={toggleBoost} disabled={acting}
                className={cn('w-full py-2.5 px-4 rounded-xl text-sm font-semibold font-display transition-all flex items-center justify-center gap-2 disabled:opacity-50',
                  listing.is_boosted
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'
                    : 'bg-amber-500 text-white hover:bg-amber-600')}>
                {listing.is_boosted ? <><ZapOff size={14} /> Remove Boost</> : <><Zap size={14} /> Boost for 30 Days</>}
              </button>
              {listing.is_boosted && listing.boost_expires_at && (
                <p className="text-xs text-navy-400 text-center mt-2">
                  Expires {timeAgo(listing.boost_expires_at)}
                </p>
              )}
            </div>

            {/* View public listing */}
            <Link href={`/listings/${listing.id}`} target="_blank"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-surface-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:border-amber-400 transition-colors card">
              <Eye size={14} /> View Public Listing
            </Link>

            {/* Delete */}
            <button onClick={deleteListing} disabled={acting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
              <Trash2 size={14} /> Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
