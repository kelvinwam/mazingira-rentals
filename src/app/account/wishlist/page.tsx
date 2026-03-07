'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import ListingCard, { ListingCardSkeleton } from '../../../components/listings/ListingCard';
import { wishlistAPI } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { Heart, ArrowLeft } from 'lucide-react';
import type { ListingCard as ListingCardType } from '../../../types';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [listings, setListings] = useState<ListingCardType[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    wishlistAPI.list()
      .then(r => setListings(r.data.data))
      .catch(() => toast.error('Could not load wishlist.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/listings"
            className="w-9 h-9 rounded-xl bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 flex items-center justify-center text-navy-500 hover:text-amber-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">My Wishlist</h1>
            <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">
              {loading ? '…' : `${listings.length} saved listing${listings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <Heart size={40} className="text-surface-300 dark:text-navy-700 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">No saved listings</h3>
            <p className="text-navy-500 dark:text-navy-400 text-sm mb-6">
              Tap the heart icon on any listing to save it here.
            </p>
            <Link href="/listings" className="btn-primary px-8">Browse Listings</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
