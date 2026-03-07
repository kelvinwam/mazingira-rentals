'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar     from '../../components/layout/Navbar';
import Footer     from '../../components/layout/Footer';
import ListingCard, { ListingCardSkeleton } from '../../components/listings/ListingCard';
import SearchBar  from '../../components/listings/SearchBar';
import { searchAPI, areasAPI } from '../../lib/api';
import { cn } from '../../lib/utils';
import { SlidersHorizontal, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Area } from '../../types';
import toast from 'react-hot-toast';

const PRICE_PRESETS = [
  { label: 'Under 5K',   min: 0,     max: 5000  },
  { label: '5K–10K',     min: 5000,  max: 10000 },
  { label: '10K–20K',    min: 10000, max: 20000 },
  { label: '20K–40K',    min: 20000, max: 40000 },
  { label: 'Above 40K',  min: 40000, max: 999999},
];

function BrowseContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [listings,     setListings]     = useState<any[]>([]);
  const [meta,         setMeta]         = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [areas,        setAreas]        = useState<Area[]>([]);
  const [showFilters,  setShowFilters]  = useState(false);
  const [page,         setPage]         = useState(1);

  // Filter state
  const [q,         setQ]         = useState(searchParams.get('q')    || '');
  const [area,      setArea]      = useState(searchParams.get('area') || '');
  const [minPrice,  setMinPrice]  = useState(searchParams.get('min_price') || '');
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get('max_price') || '');
  const [bedrooms,  setBedrooms]  = useState(searchParams.get('bedrooms')  || '');
  const [available, setAvailable] = useState(searchParams.get('available') || '');

  useEffect(() => {
    areasAPI.list().then(r => setAreas(r.data.data)).catch(() => {});
  }, []);

  const buildParams = (p = 1) => {
    const params: Record<string,any> = { page: p, limit: 12 };
    if (q)         params.q         = q;
    if (area)      params.area      = area;
    if (minPrice)  params.min_price = minPrice;
    if (maxPrice)  params.max_price = maxPrice;
    if (bedrooms)  params.bedrooms  = bedrooms;
    if (available) params.available = available;
    return params;
  };

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await searchAPI.search(buildParams(p));
      setListings(res.data.data);
      setMeta(res.data.meta);
      setPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { toast.error('Could not load listings.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(1); }, [q, area, minPrice, maxPrice, bedrooms, available]);

  const clearFilters = () => {
    setQ(''); setArea(''); setMinPrice(''); setMaxPrice('');
    setBedrooms(''); setAvailable('');
  };

  const activeFilterCount = [area, minPrice || maxPrice, bedrooms, available].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">

        {/* Header + search */}
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white mb-4">
            {q ? `Results for "${q}"` : 'Browse Rentals'}
          </h1>
          <div className="flex gap-3">
            <SearchBar
              initialValue={q}
              className="flex-1"
              onSearch={val => setQ(val)}
            />
            <button onClick={() => setShowFilters(!showFilters)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold font-display transition-all flex-shrink-0',
                showFilters || activeFilterCount > 0
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 hover:border-amber-400')}>
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white">Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline">
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            {/* Area */}
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Area</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setArea('')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    !area ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
                  All Areas
                </button>
                {areas.map(a => (
                  <button key={a.id} onClick={() => setArea(a.slug)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      area === a.slug ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Price per month</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRICE_PRESETS.map(p => {
                  const active = minPrice === String(p.min) && maxPrice === String(p.max);
                  return (
                    <button key={p.label}
                      onClick={() => { setMinPrice(String(p.min)); setMaxPrice(String(p.max)); }}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        active ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="Min KES" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)} className="input text-sm w-32" />
                <span className="text-navy-400">—</span>
                <input type="number" placeholder="Max KES" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)} className="input text-sm w-32" />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Bedrooms</p>
              <div className="flex gap-2">
                {['', '1', '2', '3', '4', '5'].map(b => (
                  <button key={b} onClick={() => setBedrooms(b)}
                    className={cn('w-10 h-10 rounded-xl text-sm font-semibold border transition-all',
                      bedrooms === b ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
                    {b || 'Any'}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Availability</p>
              <div className="flex gap-2">
                {[{ val: '', label: 'All' }, { val: 'true', label: 'Available Only' }].map(o => (
                  <button key={o.val} onClick={() => setAvailable(o.val)}
                    className={cn('px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                      available === o.val ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white dark:bg-navy-800 border-surface-200 dark:border-navy-700 text-navy-600 dark:text-navy-300 hover:border-amber-400')}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {meta && !loading && (
          <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
            {meta.total === 0
              ? 'No listings found'
              : `${meta.total} listing${meta.total !== 1 ? 's' : ''}${q ? ` matching "${q}"` : ''}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <Home size={40} className="text-surface-300 dark:text-navy-700 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">No listings found</h3>
            <p className="text-navy-500 dark:text-navy-400 text-sm mb-6">Try adjusting your search or filters.</p>
            <button onClick={clearFilters} className="btn-primary px-8">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => load(page - 1)} disabled={page <= 1}
              className="w-10 h-10 rounded-xl bg-white dark:bg-navy-800 border border-surface-200 dark:border-navy-700 flex items-center justify-center text-navy-500 disabled:opacity-40 hover:border-amber-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-navy-600 dark:text-navy-400 font-medium">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button onClick={() => load(page + 1)} disabled={page >= meta.totalPages}
              className="w-10 h-10 rounded-xl bg-white dark:bg-navy-800 border border-surface-200 dark:border-navy-700 flex items-center justify-center text-navy-500 disabled:opacity-40 hover:border-amber-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
