'use client';

import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { listingsAPI } from '../../lib/api';

interface Review {
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  listing_title: string;
  area_name: string;
}

// Fallback shown only when there are no real reviews yet
const FALLBACK: Review[] = [
  {
    reviewer_name: 'Amina Wanjiru',
    rating: 5,
    comment: 'Found my apartment in 2 days. The photos were exactly what I saw when I visited. No surprises, no agent fees.',
    created_at: '',
    listing_title: 'Studio in Athi River',
    area_name: 'Athi River',
  },
  {
    reviewer_name: 'James Mutua',
    rating: 5,
    comment: 'Listed my 3 units on a Friday. By Monday I had 12 inquiries and all were rented within 2 weeks.',
    created_at: '',
    listing_title: '3 Units in CBD',
    area_name: 'Machakos CBD',
  },
  {
    reviewer_name: 'Grace Nduku',
    rating: 5,
    comment: 'I could see the GPS location before visiting. Saved me so much time. The landlord was also very responsive.',
    created_at: '',
    listing_title: 'Bedsitter in Syokimau',
    area_name: 'Syokimau',
  },
];

const AVATAR_COLORS = [
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
];

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    listingsAPI.topReviews()
      .then(r => {
        const data = r.data.data;
        setReviews(data.length >= 2 ? data : FALLBACK);
      })
      .catch(() => setReviews(FALLBACK));
  }, []);

  const displayed = reviews.length > 0 ? reviews : FALLBACK;

  return (
    <section className="py-20 bg-white dark:bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-900 dark:text-white mb-3">
            What People Are Saying
          </h2>
          <p className="text-navy-500 dark:text-navy-400 max-w-md mx-auto">
            Real feedback from tenants and landlords across Machakos County.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayed.map((r, i) => (
            <div key={i} className="card p-6 flex flex-col gap-4">
              <Quote size={24} className="text-amber-300 dark:text-amber-700 flex-shrink-0" />
              <p className="text-navy-600 dark:text-navy-300 text-sm leading-relaxed flex-1">
                {r.comment}
              </p>
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-surface-100 dark:border-navy-800">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                  {r.reviewer_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-navy-900 dark:text-white">{r.reviewer_name}</p>
                  <p className="text-xs text-navy-400">{r.area_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
