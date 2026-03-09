import Link from 'next/link';
import { Home, LogIn, UserPlus } from 'lucide-react';

const AREAS = [
  { name: 'Machakos CBD', slug: 'machakos-cbd' },
  { name: 'Athi River',   slug: 'athi-river'   },
  { name: 'Mlolongo',     slug: 'mlolongo'     },
  { name: 'Syokimau',     slug: 'syokimau'     },
  { name: 'Kathiani',     slug: 'kathiani'     },
  { name: 'Masii',        slug: 'masii'        },
];

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-navy-800 text-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Home size={17} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-lg text-white">MachaRent</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/50 mb-5">
              Machakos County's trusted rental marketplace. Verified, scam-free apartments.
            </p>
            {/* Auth links in brand column */}
            <div className="flex flex-col gap-2">
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-amber-400 transition-colors">
                <LogIn size={13} /> Sign In to your account
              </Link>
              <Link href="/auth/register?role=LANDLORD"
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-amber-400 transition-colors">
                <UserPlus size={13} /> Register as Landlord
              </Link>
            </div>
          </div>

          {/* Areas */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Browse by Area</h4>
            <ul className="space-y-2.5">
              {AREAS.map(a => (
                <li key={a.slug}>
                  <Link href={`/listings?area=${a.slug}`}
                    className="text-sm hover:text-amber-400 transition-colors">
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/listings',                    label: 'Browse Listings'    },
                { href: '/auth/register?role=LANDLORD', label: 'List Your Property' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-amber-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-white text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms',   label: 'Terms of Use'   },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-amber-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} MachaRent. All rights reserved.</p>
          <p className="text-xs text-white/30">Made for Machakos County 🇰🇪</p>
        </div>
      </div>
    </footer>
  );
}
