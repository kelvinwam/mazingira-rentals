'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../../../store/authStore';
import { landlordAPI } from '../../../../../lib/api';
import Navbar         from '../../../../../components/layout/Navbar';
import ListingForm    from '../../../../../components/landlord/ListingForm';
import ImageUploader  from '../../../../../components/landlord/ImageUploader';
import { cn } from '../../../../../lib/utils';
import toast from 'react-hot-toast';

type Tab = 'details' | 'images';

function EditContent() {
  const router       = useRouter();
  const { id }       = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [tab,     setTab]     = useState<Tab>((searchParams.get('tab') as Tab) || 'details');
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role !== 'LANDLORD') { router.push('/listings'); return; }

    landlordAPI.getListing(id)
      .then(r => setListing(r.data.data))
      .catch(() => { toast.error('Listing not found.'); router.push('/landlord/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'LANDLORD') return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-navy-950">
      <Loader2 size={32} className="animate-spin text-amber-500" />
    </div>
  );

  if (!listing) return null;

  const formInitial = {
    title:        listing.title        || '',
    description:  listing.description  || '',
    price_kes:    String(listing.price_kes   || ''),
    deposit_kes:  String(listing.deposit_kes || ''),
    area_id:      listing.area_id      || '',
    bedrooms:     listing.bedrooms     != null ? String(listing.bedrooms)    : '',
    bathrooms:    listing.bathrooms    != null ? String(listing.bathrooms)   : '',
    floor_level:  listing.floor_level  != null ? String(listing.floor_level) : '',
    address_hint: listing.address_hint || '',
    latitude:     listing.latitude     != null ? String(listing.latitude)    : '',
    longitude:    listing.longitude    != null ? String(listing.longitude)   : '',
    amenity_ids:  listing.amenity_ids  || [],
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        <Link href="/landlord/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 transition-colors mb-6 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white mb-1">Edit Listing</h1>
          <p className="text-navy-500 dark:text-navy-400 text-sm line-clamp-1">{listing.title}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-100 dark:bg-navy-800 rounded-xl mb-6">
          {(['details', 'images'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-semibold font-display capitalize transition-all',
                tab === t
                  ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm'
                  : 'text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200')}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <ListingForm
            mode="edit"
            listingId={id}
            initial={formInitial}
          />
        )}

        {tab === 'images' && (
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-1">Listing Photos</h3>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Add up to 10 photos. The one with a ⭐ is your cover photo shown in search results.
              </p>
            </div>
            <ImageUploader
              listingId={id}
              images={listing.images || []}
              onChange={(imgs) => setListing((prev: any) => ({ ...prev, images: imgs }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    }>
      <EditContent />
    </Suspense>
  );
}
