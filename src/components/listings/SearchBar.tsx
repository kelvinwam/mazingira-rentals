'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, MapPin, X, Loader2, Building2 } from 'lucide-react';
import { searchAPI } from '../../lib/api';
import { formatKES, cn } from '../../lib/utils';
interface Suggestion {
  id:        string;
  title:     string;
  price_kes: number;
  area_name: string;
  area_slug: string;
  thumbnail: string | null;
}

interface AreaSuggestion {
  id:            string;
  name:          string;
  slug:          string;
  listing_count: number;
}

interface Props {
  initialValue?: string;
  className?:    string;
  onSearch?:     (q: string) => void;
  autoFocus?:    boolean;
}

export default function SearchBar({ initialValue = '', className, onSearch, autoFocus }: Props) {
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [q,          setQ]          = useState(initialValue);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [listings,   setListings]   = useState<Suggestion[]>([]);
  const [areas,      setAreas]      = useState<AreaSuggestion[]>([]);
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val: string) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAPI.suggest(val);
        setListings(res.data.data.listings);
        setAreas(res.data.data.areas);
        setOpen(true);
      } catch {} finally { setLoading(false); }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (onSearch) { onSearch(q); return; }
    router.push(`/listings?q=${encodeURIComponent(q)}`);
  };

  const pickListing = (id: string) => {
    setOpen(false);
    router.push(`/listings/${id}`);
  };

  const pickArea = (slug: string) => {
    setOpen(false);
    router.push(`/areas/${slug}`);
  };

  const hasSuggestions = listings.length > 0 || areas.length > 0;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => q.length >= 2 && hasSuggestions && setOpen(true)}
            placeholder="Search by area, address or keywords…"
            className="input pl-10 pr-8 w-full"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); setOpen(false); if (onSearch) onSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary px-5">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Dropdown suggestions */}
      {open && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 card shadow-card-hover z-50 overflow-hidden max-h-96 overflow-y-auto">

          {areas.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-navy-400 bg-surface-50 dark:bg-navy-800">
                Areas
              </p>
              {areas.map(a => (
                <button key={a.id} onClick={() => pickArea(a.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-navy-900 dark:text-white">{a.name}</p>
                    <p className="text-xs text-navy-400">{a.listing_count} listing{a.listing_count !== 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {listings.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-navy-400 bg-surface-50 dark:bg-navy-800">
                Listings
              </p>
              {listings.map(l => (
                <button key={l.id} onClick={() => pickListing(l.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors text-left">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 dark:bg-navy-800 flex-shrink-0">
                    {l.thumbnail
                      ? <Image src={l.thumbnail} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={14} className="text-navy-400" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-navy-900 dark:text-white truncate">{l.title}</p>
                    <p className="text-xs text-navy-400">{l.area_name} · {formatKES(l.price_kes)}/mo</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
