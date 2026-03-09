'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Star, Home, ArrowRight, MapPin, Building2, Users, CheckCircle } from 'lucide-react';
import SearchBar from '../../components/listings/SearchBar';
import { areasAPI, listingsAPI } from '../../lib/api';
import type { Area } from '../../types';

function AnimatedCounter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 50;
    const stepVal = target / steps;
    const stepMs  = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepVal;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, stepMs);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{count.toLocaleString()}</>;
}

// Real Kenyan urban/apartment photography from Unsplash
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=90&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=90&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=90&auto=format&fit=crop',
];

export default function HeroSection() {
  const router = useRouter();
  const [areas,         setAreas]         = useState<Area[]>([]);
  const [listingCount,  setListingCount]  = useState(0);
  const [landlordCount, setLandlordCount] = useState(0);
  const [bgIdx,         setBgIdx]         = useState(0);
  const [visible,       setVisible]       = useState(true);

  useEffect(() => {
    areasAPI.list().then(r => setAreas(r.data.data.slice(0, 6))).catch(() => {});
    listingsAPI.browse({ limit: 1 })
      .then(r => {
        const total = r.data.pagination?.total || 0;
        setListingCount(total);
        setLandlordCount(Math.max(1, Math.floor(total * 0.6)));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setBgIdx(i => (i + 1) % BG_IMAGES.length); setVisible(true); }, 800);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${BG_IMAGES[bgIdx]})`, opacity: visible ? 1 : 0 }}
        />
        {/* Multi-layer overlay for readability + warmth */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,15,35,0.75) 0%, rgba(5,15,35,0.55) 40%, rgba(5,15,35,0.80) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,15,35,0.4) 0%, transparent 50%, rgba(5,15,35,0.2) 100%)' }} />
        {/* Amber warmth at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-72" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.25), transparent)' }} />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 flex flex-col items-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold mb-8"
          style={{
            background: 'rgba(245,158,11,0.15)',
            borderColor: 'rgba(245,158,11,0.35)',
            color: '#FCD34D',
            backdropFilter: 'blur(12px)',
            animation: 'heroFadeUp 0.6s ease both',
          }}>
          <Star size={11} className="fill-amber-400 text-amber-400" />
          Machakos County's #1 Rental Platform
        </div>

        {/* Headline */}
        <h1
          className="font-display font-extrabold text-center leading-tight mb-5"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            color: '#fff',
            textShadow: '0 2px 30px rgba(0,0,0,0.6)',
            animation: 'heroFadeUp 0.7s ease 0.1s both',
          }}>
          Find Your Perfect
          <span className="block" style={{
            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 45%, #FB923C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Home in Machakos
          </span>
        </h1>

        <p className="text-center max-w-xl mx-auto mb-10 leading-relaxed"
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '1.05rem',
            animation: 'heroFadeUp 0.7s ease 0.2s both',
          }}>
          Browse verified rentals across Machakos CBD, Athi River, Syokimau, Mlolongo and more.
          Real photos, real prices, no agents.
        </p>

        {/* Search — glass card */}
        <div className="w-full max-w-2xl mb-8" style={{ animation: 'heroFadeUp 0.7s ease 0.3s both' }}>
          <div style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '1.25rem',
            padding: '8px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
            <SearchBar
              className="w-full"
              onSearch={q => router.push(`/listings?q=${encodeURIComponent(q)}`)}
              autoFocus={false}
            />
          </div>
        </div>

        {/* Area pills */}
        {areas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10"
            style={{ animation: 'heroFadeUp 0.7s ease 0.4s both' }}>
            <span className="text-xs self-center mr-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <MapPin size={10} /> Popular:
            </span>
            {areas.map(a => (
              <Link key={a.id} href={`/areas/${a.slug}`}
                className="text-xs font-medium transition-all duration-200"
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.background = 'rgba(245,158,11,0.25)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(245,158,11,0.45)';
                  (e.target as HTMLElement).style.color = '#FCD34D';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                  (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                }}>
                {a.name}
              </Link>
            ))}
          </div>
        )}

        {/* Stats — 3 glass cards, always visible */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-md mb-10"
          style={{ animation: 'heroFadeUp 0.7s ease 0.5s both' }}>
          {[
            { icon: Building2, value: listingCount || 1,  suffix: '+', label: 'Listings',   color: '#FCD34D' },
            { icon: MapPin,    value: areas.length  || 6, suffix: '',  label: 'Areas',      color: '#6EE7B7' },
            { icon: Users,     value: landlordCount || 1, suffix: '+', label: 'Landlords',  color: '#93C5FD' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center py-5 px-3 rounded-2xl transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}>
              <s.icon size={18} style={{ color: s.color, marginBottom: '8px' }} />
              <p className="font-display font-extrabold text-xl sm:text-2xl" style={{ color: s.color }}>
                <AnimatedCounter target={s.value} />{s.suffix}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Trust bar — glass pill */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 py-4 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.10)',
            animation: 'heroFadeUp 0.7s ease 0.6s both',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
          {[
            { icon: Shield,      label: 'Verified Listings' },
            { icon: Home,        label: 'Real Photos'       },
            { icon: CheckCircle, label: 'No Agent Fees'     },
            { icon: Star,        label: 'Tenant Reviews'    },
          ].map(t => (
            <span key={t.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
              <t.icon size={11} style={{ color: '#F59E0B' }} /> {t.label}
            </span>
          ))}
          <Link href="/listings" className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: '#FCD34D' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FEF3C7')}
            onMouseLeave={e => (e.currentTarget.style.color = '#FCD34D')}>
            View All <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ opacity: 0.4, animation: 'bounce 2.5s ease infinite' }}>
        <div className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: '1.5px solid rgba(255,255,255,0.35)' }}>
          <div className="w-1 h-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.7)', animation: 'scrollDot 1.8s ease infinite' }} />
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Scroll</span>
      </div>

      <style jsx>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50%       { transform: translateY(7px); opacity: 0.2; }
        }
      `}</style>
    </section>
  );
}
