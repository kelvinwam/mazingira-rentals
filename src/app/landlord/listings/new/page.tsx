'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';
import Navbar from '../../../../components/layout/Navbar';
import ListingForm from '../../../../components/landlord/ListingForm';

export default function NewListingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role !== 'LANDLORD') router.push('/listings');
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'LANDLORD') return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        <Link href="/landlord/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 transition-colors mb-6 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white mb-1">
            Create New Listing
          </h1>
          <p className="text-navy-500 dark:text-navy-400 text-sm">
            Fill in the details below. You can add photos after submitting.
          </p>
        </div>

        <ListingForm mode="create" />
      </div>
    </div>
  );
}
