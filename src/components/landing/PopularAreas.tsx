'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bed, Bath, Eye, Zap, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { listingsAPI } from '../../lib/api';
import { formatKES, cn } from '../../lib/utils';

interface Listing {
  id: string; title: string; price_kes: number;
  bedrooms: number | null; bathrooms: number | null;
  is_available: boolean; is_boosted: boolean;
  verification_level: string; avg_rating: number;
  review_count: number; address_hint: string | null;
  area_name: string; area_slug: string;
  primary_image: string | null;
}

export default function PopularAreas() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = () => {
    setLoading(true);
    listingsAPI.featured()
      .then(r => setListings(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  return (
    <section className="py-20 bg-surface-50 dark:bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-900 dark:text-white mb-3">
              Featured Listings
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={fetchListings}
              className="flex items-center gap-1.5 text-sm text-navy-400 hover:text-amber-600 transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Shuffle
            </button>
            <Link href="/listings"
              className="flex items-center gap-1.5 text-sm font-semibold font-display text-amber-600 dark:text-amber-400 hover:gap-2.5 transition-all">
              View all <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-72" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-navy-400 dark:text-navy-500 mb-4">No listings yet.</p>
            <Link href="/auth/register?role=LANDLORD" className="btn-primary px-6">
              Be the first to list
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(listing => (
              <Link key={listing.id} href={`/listings/${listing.id}`}
                className="group card overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col">

                {/* Image */}
                <div className="relative h-52 bg-surface-100 dark:bg-navy-800 overflow-hidden flex-shrink-0">
                  {listing.primary_image ? (
                    <Image
                      src={listing.primary_image}
                      alt={listing.title}
                      fill sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy-300 dark:text-navy-600 text-sm">
                      No photo
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Boosted badge */}
                  {listing.is_boosted && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#fff',
                        boxShadow: '0 2px 10px rgba(245,158,11,0.5)',
                      }}>
                      <Zap size={10} className="fill-white" /> Featured
                    </div>
                  )}

                  {/* Availability */}
                  <div className={cn(
                    'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold',
                    listing.is_available
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                  )}>
                    {listing.is_available ? 'Available' : 'Taken'}
                  </div>

                  {/* Verification bottom-left */}
                  {listing.verification_level !== 'UNVERIFIED' && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white">
                      <ShieldCheck size={10} className="text-emerald-400" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-sm text-navy-900 dark:text-white line-clamp-2 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {listing.title}
                  </h3>

                  <p className="flex items-center gap-1 text-xs text-navy-400 mb-3">
                    <MapPin size={11} className="text-amber-500 flex-shrink-0" />
                    {listing.address_hint || listing.area_name}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-navy-500 dark:text-navy-400 mb-4">
                    {listing.bedrooms != null && <span className="flex items-center gap-1"><Bed size={11} />{listing.bedrooms} bed</span>}
                    {listing.bathrooms != null && <span className="flex items-center gap-1"><Bath size={11} />{listing.bathrooms} bath</span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <p className="font-display font-extrabold text-base text-navy-900 dark:text-white">
                        {formatKES(listing.price_kes)}
                      </p>
                      <p className="text-xs text-navy-400">/ month</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-1.5 flex items-center gap-1 transition-all">
                      View <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10 sm:hidden">
          <Link href="/listings" className="btn-primary px-8">View All Listings</Link>
        </div>
      </div>
    </section>
  );
}
