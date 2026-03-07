'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ShieldCheck, Star, Home } from 'lucide-react';

const AREAS = [
  { label: 'Machakos CBD', slug: 'machakos-cbd' },
  { label: 'Athi River',   slug: 'athi-river'   },
  { label: 'Mlolongo',     slug: 'mlolongo'     },
  { label: 'Syokimau',     slug: 'syokimau'     },
  { label: 'Kathiani',     slug: 'kathiani'     },
  { label: 'Masii',        slug: 'masii'        },
];

export default function HeroSection() {
  const router = useRouter();
  const [q,    setQ]    = useState('');
  const [area, setArea] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q)    params.set('q',    q);
    if (area) params.set('area', area);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy-950 dot-pattern">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(245,158,11,0.12) 0%, transparent 65%)' }} />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/70 text-sm font-medium">Machakos County's rental marketplace</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white mb-5 leading-[1.05] animate-fade-up">
          Find Your Home<br />
          <span className="gradient-text">in Machakos.</span>
        </h1>

        <p className="text-white/55 text-lg leading-relaxed mb-10 max-w-xl mx-auto animate-fade-up"
          style={{ animationDelay: '0.1s' }}>
          Verified apartments. Real photos. Exact GPS locations.
          No scams — just your perfect home.
        </p>

        {/* Search box */}
        <form onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8 animate-fade-up"
          style={{ animationDelay: '0.15s' }}>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search apartments, areas…"
              className="w-full h-13 pl-10 pr-4 py-3.5 bg-white dark:bg-navy-900 rounded-xl text-navy-900 dark:text-white
                         placeholder-navy-400 text-sm border border-surface-200 dark:border-navy-700
                         focus:outline-none focus:ring-2 focus:ring-amber-400/60 shadow-card" />
          </div>
          <select value={area} onChange={e => setArea(e.target.value)}
            className="h-13 px-4 py-3.5 bg-white dark:bg-navy-900 rounded-xl text-navy-900 dark:text-white text-sm
                       border border-surface-200 dark:border-navy-700 focus:outline-none focus:ring-2 focus:ring-amber-400/60 shadow-card sm:w-44">
            <option value="">All Areas</option>
            {AREAS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
          </select>
          <button type="submit" className="btn-primary px-7 py-3.5 rounded-xl text-base h-13">Search</button>
        </form>

        {/* Quick area pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-14 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          {AREAS.map(a => (
            <button key={a.slug} onClick={() => router.push(`/listings?area=${a.slug}`)}
              className="flex items-center gap-1.5 glass rounded-full px-3.5 py-1.5 text-white/70 text-xs font-medium
                         hover:bg-white/15 hover:text-white transition-all">
              <MapPin size={11} className="text-amber-400" />
              {a.label}
            </button>
          ))}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-4 mb-14 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          {[
            { icon: ShieldCheck, label: 'Admin Verified',    color: 'text-emerald-400' },
            { icon: Star,        label: 'Genuine Reviews',   color: 'text-amber-400'   },
            { icon: MapPin,      label: 'GPS Locations',     color: 'text-blue-400'    },
            { icon: Home,        label: 'No Commission',     color: 'text-purple-400'  },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-2 glass rounded-full px-4 py-1.5">
              <t.icon size={13} className={t.color} />
              <span className="text-white/70 text-xs font-medium">{t.label}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {[
            { v: '6',    l: 'Areas in Machakos' },
            { v: '0',    l: 'Commission Fees'   },
            { v: '100%', l: 'Admin Verified'    },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-4">
              {i > 0 && <div className="w-px h-8 bg-white/10" />}
              <div>
                <p className="font-display font-extrabold text-2xl text-white">{s.v}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-surface-50 dark:from-navy-950 to-transparent pointer-events-none" />
    </section>
  );
}
