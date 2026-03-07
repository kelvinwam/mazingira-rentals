import { Search, Phone, Star } from 'lucide-react';

const STEPS = [
  {
    icon:  Search,
    step:  '01',
    title: 'Browse Verified Listings',
    desc:  'Filter by area, price, and features. Every listing is admin-approved — no scams, no fake photos.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  },
  {
    icon:  Phone,
    step:  '02',
    title: 'Contact the Landlord',
    desc:  'Call or WhatsApp the landlord directly. GPS locations mean you can visit with confidence.',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon:  Star,
    step:  '03',
    title: 'Move In & Review',
    desc:  'Found your home? Move in and leave an honest review to help the next tenant.',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-surface-50 dark:bg-navy-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-900 dark:text-white mb-3">
            How It Works
          </h2>
          <p className="text-navy-500 dark:text-navy-400 max-w-md mx-auto">
            Finding a rental in Machakos has never been this straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] right-0 h-px border-t-2 border-dashed border-surface-200 dark:border-navy-800 z-0" />
              )}
              <div className="card p-7 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${s.color}`}>
                  <s.icon size={24} strokeWidth={1.8} />
                </div>
                <span className="font-display font-black text-4xl text-surface-200 dark:text-navy-800 absolute top-6 right-6">
                  {s.step}
                </span>
                <h3 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-navy-500 dark:text-navy-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
