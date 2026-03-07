import { ShieldCheck, Camera, MapPin, Star } from 'lucide-react';

const SIGNALS = [
  { icon: ShieldCheck, title: 'Admin Approved',     desc: 'Every listing reviewed before going live',   color: 'text-emerald-500' },
  { icon: Camera,      title: 'Real Photos Only',   desc: 'Minimum 3 photos required per listing',       color: 'text-blue-500'    },
  { icon: MapPin,      title: 'GPS Verified',       desc: 'Exact coordinates — no guessing addresses',   color: 'text-amber-500'   },
  { icon: Star,        title: 'Honest Reviews',     desc: 'Tenants who actually rented leave feedback',  color: 'text-purple-500'  },
];

export default function TrustBar() {
  return (
    <section className="py-16 bg-white dark:bg-navy-900 border-y border-surface-100 dark:border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SIGNALS.map(s => (
            <div key={s.title} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-surface-50 dark:bg-navy-800 flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-navy-900 dark:text-white mb-0.5">{s.title}</p>
                <p className="text-xs text-navy-500 dark:text-navy-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
