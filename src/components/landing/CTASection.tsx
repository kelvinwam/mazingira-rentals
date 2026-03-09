import Link from 'next/link';
import { Building2, ArrowRight, Search } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 bg-navy-950 dot-pattern relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Landlord CTA */}
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-amber">
              <Building2 size={26} className="text-white" strokeWidth={1.8} />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-3">
              Are you a landlord?
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              List your property for free and reach thousands of tenants looking for verified rentals in Machakos.
            </p>
            <Link href="/auth/register?role=LANDLORD"
              className="btn-primary px-6 py-3 text-sm rounded-xl justify-center inline-flex">
              List Your Property — Free <ArrowRight size={15} />
            </Link>
          </div>

          {/* Tenant CTA */}
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search size={26} className="text-white" strokeWidth={1.8} />
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white mb-3">
              Looking for a home?
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Browse verified listings across Machakos County. No registration needed — just search and contact the landlord directly.
            </p>
            <Link href="/listings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold font-display rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
              Browse Listings <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
