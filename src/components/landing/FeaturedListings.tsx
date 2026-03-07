'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listingsAPI } from '../../lib/api';
import ListingCard, { ListingCardSkeleton } from '../../components/listings/ListingCard';
import type { ListingCard as ListingCardType } from '../../types';

export default function FeaturedListings() {
  const [listings, setListings] = useState<ListingCardType[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    listingsAPI.featured()
      .then(r => setListings(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-white dark:bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-900 dark:text-white mb-3">
              Featured Listings
            </h2>
            <p className="text-navy-500 dark:text-navy-400">Verified, top-rated apartments hand-picked for you.</p>
          </div>
          <Link href="/listings"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold font-display text-amber-600 dark:text-amber-400 hover:gap-2.5 transition-all">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-navy-400 dark:text-navy-500">
              No listings yet — landlords can{' '}
              <Link href="/auth/register?role=LANDLORD" className="text-amber-600 underline">list their property</Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        <div className="text-center mt-10 sm:hidden">
          <Link href="/listings" className="btn-primary px-8">View All Listings</Link>
        </div>
      </div>
    </section>
  );
}
