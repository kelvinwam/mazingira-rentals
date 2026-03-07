'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Home } from 'lucide-react';
import { areasAPI } from '../../lib/api';
import { formatKES } from '../../lib/utils';
import type { Area } from '../../types';

const AREA_IMAGES: Record<string, string> = {
  'machakos-cbd': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&q=80',
  'athi-river':   'https://images.unsplash.com/photo-1580223530509-d2de4c475f46?w=600&q=80',
  'mlolongo':     'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
  'syokimau':     'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
  'kathiani':     'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
  'masii':        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
};

export default function PopularAreas() {
  const [areas,   setAreas]   = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    areasAPI.list()
      .then(r => setAreas(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-surface-50 dark:bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-900 dark:text-white mb-3">
            Browse by Area
          </h2>
          <p className="text-navy-500 dark:text-navy-400 max-w-md mx-auto">
            We cover every corner of Machakos County — find the neighbourhood that suits you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-48" />
              ))
            : areas.map(area => (
                <Link key={area.slug} href={`/listings?area=${area.slug}`}
                  className="relative rounded-2xl overflow-hidden h-48 group cursor-pointer block">
                  {/* Background image */}
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${AREA_IMAGES[area.slug] || AREA_IMAGES['machakos-cbd']})` }} />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="font-display font-bold text-white text-lg mb-1">{area.name}</p>
                    <div className="flex items-center gap-3 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <Home size={11} className="text-amber-400" />
                        {area.listing_count} listings
                      </span>
                      {area.avg_price_kes > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-amber-400" />
                          avg {formatKES(area.avg_price_kes)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </div>
    </section>
  );
}
