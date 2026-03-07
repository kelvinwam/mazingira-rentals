'use client';

import Link  from 'next/link';
import Image from 'next/image';
import { MapPin, Bed, Bath, Star, ShieldCheck } from 'lucide-react';
import { cn, formatKES } from '../../lib/utils';
import type { ListingCard as ListingCardType } from '../../types';

interface Props { listing: ListingCardType; }

export default function ListingCard({ listing: l }: Props) {
  return (
    <Link href={`/listings/${l.id}`}
      className="card group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden block">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-100 dark:bg-navy-800">
        {l.primary_image ? (
          <Image src={l.thumbnail || l.primary_image} alt={l.title} fill
            className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-navy-400 text-sm">No photo</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold font-display',
            l.is_available ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
            {l.is_available ? 'Available' : 'Taken'}
          </span>
          {l.is_boosted && (
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold font-display">
              Featured
            </span>
          )}
        </div>

        {/* Verification */}
        {l.verification_level !== 'UNVERIFIED' && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-navy-900/90 rounded-full flex items-center justify-center shadow-sm">
            <ShieldCheck size={14} className={
              l.verification_level === 'IN_PERSON_VERIFIED' ? 'text-amber-500' : 'text-emerald-500'
            } />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-display font-bold text-navy-900 dark:text-white text-sm line-clamp-1 mb-1">
          {l.title}
        </p>
        <p className="flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400 mb-3">
          <MapPin size={11} className="text-amber-500 flex-shrink-0" />
          {l.address_hint || l.area_name}
        </p>

        <div className="flex items-center gap-3 text-xs text-navy-500 dark:text-navy-400 mb-3">
          {l.bedrooms  != null && <span className="flex items-center gap-1"><Bed  size={12} />{l.bedrooms} bed</span>}
          {l.bathrooms != null && <span className="flex items-center gap-1"><Bath size={12} />{l.bathrooms} bath</span>}
          {l.avg_rating > 0 && (
            <span className="flex items-center gap-1 ml-auto">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {Number(l.avg_rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="font-display font-extrabold text-amber-600 dark:text-amber-400 text-base">
            {formatKES(l.price_kes)}
            <span className="text-xs font-normal text-navy-400">/mo</span>
          </p>
          <span className="text-xs bg-surface-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 px-2 py-1 rounded-lg font-medium">
            {l.area_name}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="skeleton h-3 w-2/3 rounded-lg" />
        <div className="skeleton h-5 w-1/3 rounded-lg mt-1" />
      </div>
    </div>
  );
}
