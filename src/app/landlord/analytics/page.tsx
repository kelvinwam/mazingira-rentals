'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { analyticsAPI } from '../../../lib/api';
import { formatKES, timeAgo } from '../../../lib/utils';
import Navbar from '../../../components/layout/Navbar';
import {
  ArrowLeft, Eye, MessageSquare, Heart, TrendingUp,
  Zap, Building2, Users, Star, Loader2, ArrowUpRight,
  CheckCircle, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DayView  { day: string; views: number; }
interface TopListing {
  id: string; title: string; view_count: number; inquiry_count: number;
  wishlist_count: number; avg_rating: number; price_kes: number;
  is_boosted: boolean; status: string; area_name: string; primary_image: string | null;
}
interface Conversion {
  total_views: string; total_inquiries: string; total_wishlists: string;
  active_count: string; rented_count: string;
}
interface RecentInquiry {
  id: string; created_at: string; last_message: string;
  listing_title: string; tenant_name: string;
}
interface BoostRecord {
  boost_days: number; amount_kes: number; status: string;
  boost_starts_at: string; boost_ends_at: string; listing_title: string;
}
interface Analytics {
  dailyViews: DayView[];
  topListings: TopListing[];
  conversion: Conversion;
  recentInquiries: RecentInquiry[];
  boostHistory: BoostRecord[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LANDLORD') { router.push('/auth/login'); return; }
    analyticsAPI.landlord()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'LANDLORD') return null;

  // Build 14-day chart data filling gaps with 0
  const chartData = (() => {
    if (!data) return [];
    const map: Record<string, number> = {};
    data.dailyViews.forEach(d => { map[d.day.slice(0, 10)] = Number(d.views); });
    const days: { label: string; views: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }),
        views: map[key] || 0,
      });
    }
    return days;
  })();

  const maxViews = Math.max(...chartData.map(d => d.views), 1);

  const conversionRate = data
    ? Number(data.conversion.total_views) > 0
      ? ((Number(data.conversion.total_inquiries) / Number(data.conversion.total_views)) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/landlord/dashboard"
            className="w-9 h-9 rounded-xl bg-white dark:bg-navy-800 border border-surface-200 dark:border-navy-700 flex items-center justify-center text-navy-500 hover:text-amber-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">Analytics</h1>
            <p className="text-navy-500 dark:text-navy-400 text-sm mt-0.5">Track your listing performance</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-amber-500" />
          </div>
        ) : data && (
          <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Eye,           label: 'Total Views',      value: Number(data.conversion.total_views).toLocaleString(),     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
                { icon: MessageSquare, label: 'Total Inquiries',  value: Number(data.conversion.total_inquiries).toLocaleString(), color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20'},
                { icon: Heart,         label: 'Wishlisted',       value: Number(data.conversion.total_wishlists).toLocaleString(), color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-900/20'   },
                { icon: TrendingUp,    label: 'Conversion Rate',  value: `${conversionRate}%`,                                    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20'},
              ].map(kpi => (
                <div key={kpi.label} className="card p-5">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                    <kpi.icon size={18} className={kpi.color} />
                  </div>
                  <p className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">{kpi.value}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Status summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-amber-500" />
                <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Listing Status</h2>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-navy-600 dark:text-navy-300">
                    <strong className="text-navy-900 dark:text-white">{data.conversion.active_count}</strong> Active
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm text-navy-600 dark:text-navy-300">
                    <strong className="text-navy-900 dark:text-white">{data.conversion.rented_count}</strong> Rented
                  </span>
                </div>
              </div>
            </div>

            {/* Views chart — last 14 days */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" />
                  <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Views — Last 14 Days</h2>
                </div>
                <span className="text-xs text-navy-400">
                  {chartData.reduce((s, d) => s + d.views, 0)} total views
                </span>
              </div>

              {chartData.every(d => d.views === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye size={32} className="text-surface-300 dark:text-navy-700 mb-3" />
                  <p className="text-navy-500 dark:text-navy-400 text-sm">No views recorded yet.</p>
                  <p className="text-navy-400 text-xs mt-1">Views will appear here once tenants start visiting your listings.</p>
                </div>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                  {chartData.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group">
                      <span className="text-xs text-navy-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.views}
                      </span>
                      <div className="w-full relative flex items-end justify-center" style={{ height: '100px' }}>
                        <div
                          className="w-full max-w-[24px] rounded-t-md bg-amber-400 dark:bg-amber-500 hover:bg-amber-500 dark:hover:bg-amber-400 transition-all cursor-default"
                          style={{ height: `${Math.max((day.views / maxViews) * 100, day.views > 0 ? 8 : 2)}px` }}
                        />
                      </div>
                      <span className="text-[9px] text-navy-400 whitespace-nowrap">{day.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top listings */}
            {data.topListings.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-surface-100 dark:border-navy-800 flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Top Performing Listings</h2>
                </div>
                <div className="divide-y divide-surface-50 dark:divide-navy-800">
                  {data.topListings.map((lst, i) => (
                    <div key={lst.id} className="flex items-center gap-4 p-4 hover:bg-surface-25 dark:hover:bg-navy-900/40 transition-colors">
                      <span className="font-display font-black text-2xl text-surface-200 dark:text-navy-800 w-8 text-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
                        {lst.primary_image
                          ? <img src={lst.primary_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Building2 size={16} className="text-navy-400" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-navy-900 dark:text-white truncate">{lst.title}</p>
                        <p className="text-xs text-navy-400 mt-0.5">{lst.area_name} · {formatKES(lst.price_kes)}/mo</p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-xs text-navy-500 dark:text-navy-400">
                        <span className="flex items-center gap-1"><Eye size={11} />{lst.view_count}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={11} />{lst.inquiry_count}</span>
                        <span className="flex items-center gap-1"><Heart size={11} />{lst.wishlist_count}</span>
                        {lst.is_boosted && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Zap size={11} className="fill-amber-500" /> Boosted
                          </span>
                        )}
                      </div>
                      <Link href={`/listings/${lst.id}`}
                        className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-navy-800 flex items-center justify-center text-navy-400 hover:text-amber-600 transition-colors flex-shrink-0">
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent inquiries + boost history side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent inquiries */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-surface-100 dark:border-navy-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-purple-500" />
                    <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Recent Inquiries</h2>
                  </div>
                  <Link href="/messages" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">View all →</Link>
                </div>
                {data.recentInquiries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={28} className="text-surface-300 dark:text-navy-700 mx-auto mb-2" />
                    <p className="text-navy-500 dark:text-navy-400 text-sm">No inquiries yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-50 dark:divide-navy-800">
                    {data.recentInquiries.map(inq => (
                      <div key={inq.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-navy-900 dark:text-white">{inq.tenant_name}</p>
                            <p className="text-xs text-navy-400 truncate mt-0.5">{inq.listing_title}</p>
                            {inq.last_message && (
                              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1 line-clamp-1 italic">"{inq.last_message}"</p>
                            )}
                          </div>
                          <span className="text-xs text-navy-400 flex-shrink-0">{timeAgo(inq.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Boost history */}
              <div className="card overflow-hidden">
                <div className="p-5 border-b border-surface-100 dark:border-navy-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Boost History</h2>
                  </div>
                  <Link href="/landlord/dashboard" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">Dashboard →</Link>
                </div>
                {data.boostHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <Zap size={28} className="text-surface-300 dark:text-navy-700 mx-auto mb-2" />
                    <p className="text-navy-500 dark:text-navy-400 text-sm">No boosts yet.</p>
                    <p className="text-xs text-navy-400 mt-1">Boost a listing to get more views.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-50 dark:divide-navy-800">
                    {data.boostHistory.map((b, i) => (
                      <div key={i} className="p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={14} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-navy-900 dark:text-white truncate">{b.listing_title}</p>
                          <p className="text-xs text-navy-400 mt-0.5">
                            {b.boost_days} days · {formatKES(b.amount_kes)}
                          </p>
                          {b.boost_ends_at && (
                            <p className="text-xs text-navy-400 mt-0.5">
                              Ended {new Date(b.boost_ends_at).toLocaleDateString('en-KE')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
