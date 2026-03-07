'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { landlordAPI } from '../../../lib/api';
import { cn, formatKES } from '../../../lib/utils';
import Navbar from '../../../components/layout/Navbar';
import StatsCard from '../../../components/landlord/StatsCard';
import {
  Plus, Eye, MessageSquare, Heart, Building2,
  ToggleLeft, ToggleRight, Edit, Trash2, Loader2,
  ShieldCheck, Clock, XCircle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Stats {
  listings:  { total: string; active: string; pending: string };
  views:     number;
  inquiries: number;
  wishlists: number;
}

interface Listing {
  id: string; title: string; price_kes: number;
  area_name: string; status: string; is_available: boolean;
  view_count: number; inquiry_count: number; wishlist_count: number;
  avg_rating: number; review_count: number;
  primary_image: string | null; created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE:    { label: 'Active',    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', icon: CheckCircle },
  PENDING:   { label: 'Pending',   color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',         icon: Clock       },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',                 icon: XCircle     },
  SUSPENDED: { label: 'Suspended', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',     icon: XCircle     },
  ARCHIVED:  { label: 'Archived',  color: 'text-navy-400 bg-surface-100 dark:bg-navy-800',                                icon: XCircle     },
};

export default function LandlordDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [stats,    setStats]    = useState<Stats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role !== 'LANDLORD') { router.push('/listings'); return; }

    Promise.all([landlordAPI.stats(), landlordAPI.listings()])
      .then(([sRes, lRes]) => {
        setStats(sRes.data.data);
        setListings(lRes.data.data);
      })
      .catch(() => toast.error('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  const toggleAvailability = async (listing: Listing) => {
    try {
      await landlordAPI.toggleAvailability(listing.id, !listing.is_available);
      setListings(prev => prev.map(l =>
        l.id === listing.id ? { ...l, is_available: !l.is_available } : l
      ));
      toast.success(`Marked as ${!listing.is_available ? 'available' : 'taken'}.`);
    } catch {
      toast.error('Could not update availability.');
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await landlordAPI.deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing deleted.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete listing.');
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'LANDLORD') return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">
              Landlord Dashboard
            </h1>
            <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Landlord'} 👋
            </p>
          </div>
          <Link href="/landlord/listings/new" className="btn-primary px-5 py-2.5">
            <Plus size={16} /> New Listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={Building2}    label="Total Listings"
            value={stats?.listings.total   || 0}
            sub={`${stats?.listings.active || 0} active · ${stats?.listings.pending || 0} pending`}
            color="text-amber-500" loading={loading} />
          <StatsCard icon={Eye}          label="Total Views"      value={stats?.views     || 0} color="text-blue-500"    loading={loading} />
          <StatsCard icon={MessageSquare}label="Inquiries"        value={stats?.inquiries || 0} color="text-purple-500"  loading={loading} />
          <StatsCard icon={Heart}        label="Wishlisted"       value={stats?.wishlists || 0} color="text-rose-500"    loading={loading} />
        </div>

        {/* Listings table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-surface-100 dark:border-navy-800 flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Your Listings</h2>
            <Link href="/landlord/listings/new"
              className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              <Plus size={14} /> Add new
            </Link>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 size={40} className="text-surface-300 dark:text-navy-700 mx-auto mb-4" />
              <h3 className="font-display font-bold text-navy-900 dark:text-white mb-2">No listings yet</h3>
              <p className="text-navy-500 dark:text-navy-400 text-sm mb-5">Create your first listing to start receiving tenant inquiries.</p>
              <Link href="/landlord/listings/new" className="btn-primary px-6">Create First Listing</Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-50 dark:divide-navy-800">
              {listings.map(listing => {
                const status = STATUS_CONFIG[listing.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = status.icon;
                return (
                  <div key={listing.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-surface-25 dark:hover:bg-navy-900/50 transition-colors">

                    {/* Image */}
                    <div className="w-full sm:w-20 h-32 sm:h-14 rounded-xl overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
                      {listing.primary_image ? (
                        <img src={listing.primary_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 size={18} className="text-navy-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="font-display font-semibold text-sm text-navy-900 dark:text-white line-clamp-1 flex-1">
                          {listing.title}
                        </p>
                        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0', status.color)}>
                          <StatusIcon size={11} /> {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-navy-400 mt-0.5">{listing.area_name} · {formatKES(listing.price_kes)}/mo</p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-navy-400">
                        <span className="flex items-center gap-1"><Eye size={11} />{listing.view_count}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} />{listing.inquiry_count}</span>
                        <span className="flex items-center gap-1"><Heart size={11} />{listing.wishlist_count}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Availability toggle */}
                      {listing.status === 'ACTIVE' && (
                        <button onClick={() => toggleAvailability(listing)}
                          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            listing.is_available
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                              : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                          )}>
                          {listing.is_available
                            ? <><ToggleRight size={14} /> Available</>
                            : <><ToggleLeft  size={14} /> Taken</>}
                        </button>
                      )}

                      <Link href={`/landlord/listings/${listing.id}/edit`}
                        className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <Edit size={14} />
                      </Link>

                      <button
                        onClick={() => deleteListing(listing.id)}
                        disabled={deleting === listing.id}
                        className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                        {deleting === listing.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
