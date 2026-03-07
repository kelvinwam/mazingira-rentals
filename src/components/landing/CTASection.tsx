import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 bg-navy-950 dot-pattern relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-amber">
          <Building2 size={26} className="text-white" strokeWidth={1.8} />
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4">
          Are you a landlord in Machakos?
        </h2>
        <p className="text-white/60 text-base leading-relaxed mb-8 max-w-xl mx-auto">
          List your property on Mazingira for free. Reach thousands of tenants looking for verified rentals in your area.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register?role=LANDLORD" className="btn-primary px-8 py-3.5 text-base rounded-xl justify-center">
            List Your Property — Free <ArrowRight size={16} />
          </Link>
          <Link href="/listings" className="glass text-white font-semibold font-display text-base py-3.5 px-8 rounded-xl hover:bg-white/15 transition-colors inline-flex items-center justify-center">
            Browse as Tenant
          </Link>
        </div>
      </div>
    </section>
  );
}
