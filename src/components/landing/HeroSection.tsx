'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Star, Home, ArrowRight } from 'lucide-react';
import SearchBar from '../../components/listings/SearchBar';
import { areasAPI } from '../../lib/api';
import type { Area } from '../../types';

export default function HeroSection() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    areasAPI.list().then(r => setAreas(r.data.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy-950">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl" />
        <div className="dot-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6 animate-fadeIn">
          <Star size={11} className="fill-amber-400" /> Machakos County's #1 Rental Platform
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5 animate-fadeUp">
          Find Your Perfect
          <span className="gradient-text block">Home in Machakos</span>
        </h1>

        <p className="text-navy-300 text-lg max-w-2xl mx-auto mb-10 animate-fadeUp">
          Browse verified rentals across Machakos CBD, Athi River, Syokimau, Mlolongo and more. Real photos, real prices, no agents.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8 animate-fadeUp">
          <SearchBar
            className="w-full"
            onSearch={q => router.push(`/listings?q=${encodeURIComponent(q)}`)}
            autoFocus={false}
          />
        </div>

        {/* Area pills */}
        {areas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12 animate-fadeIn">
            <span className="text-navy-400 text-sm self-center">Browse by area:</span>
            {areas.map(a => (
              <Link key={a.id} href={`/areas/${a.slug}`}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium hover:bg-amber-500/20 hover:border-amber-500/30 hover:text-amber-300 transition-all">
                {a.name}
              </Link>
            ))}
          </div>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 text-navy-400 text-xs animate-fadeIn">
          <span className="flex items-center gap-1.5"><Shield size={12} className="text-amber-500" /> Verified Listings</span>
          <span className="flex items-center gap-1.5"><Home size={12} className="text-amber-500" /> Real Photos</span>
          <span className="flex items-center gap-1.5"><Star size={12} className="text-amber-500" /> Tenant Reviews</span>
          <span className="flex items-center gap-1.5">
            <ArrowRight size={12} className="text-amber-500" />
            <Link href="/listings" className="hover:text-amber-400 transition-colors">View All Listings</Link>
          </span>
        </div>
      </div>
    </section>
  );
}
