import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar  from '../../../components/layout/Navbar';
import Footer  from '../../../components/layout/Footer';
import ListingCard, { ListingCardSkeleton } from '../../../components/listings/ListingCard';
import { MapPin, Home } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

async function getArea(slug: string) {
  try {
    const res = await fetch(`${API}/areas/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch { return null; }
}

async function getListings(areaSlug: string) {
  try {
    const res = await fetch(`${API}/listings?area=${areaSlug}&limit=24`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const area = await getArea(params.slug);
  if (!area) return { title: 'Area Not Found' };

  const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    title:       `Rentals in ${area.name}, Machakos County`,
    description: `Browse ${area.listing_count || 0} rental listings in ${area.name}. Find apartments and houses for rent in ${area.name}, Machakos County.`,
    openGraph: {
      title:       `Rentals in ${area.name} | Mazingira`,
      description: `Find rental apartments in ${area.name}, Machakos County.`,
      url:          `${BASE}/areas/${params.slug}`,
    },
  };
}

export default async function AreaPage({ params }: { params: { slug: string } }) {
  const [area, listings] = await Promise.all([
    getArea(params.slug),
    getListings(params.slug),
  ]);

  if (!area) notFound();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-navy-400 mb-6">
          <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-amber-500 transition-colors">Listings</Link>
          <span>/</span>
          <span className="text-navy-700 dark:text-navy-300">{area.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white">
                {area.name}
              </h1>
            </div>
            {area.description && (
              <p className="text-navy-500 dark:text-navy-400 text-sm max-w-xl">{area.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 flex-shrink-0">
            <Home size={14} className="text-amber-500" />
            <span><strong className="text-navy-900 dark:text-white">{listings.length}</strong> listing{listings.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Listings grid */}
        {listings.length === 0 ? (
          <div className="text-center py-24">
            <Home size={40} className="text-surface-300 dark:text-navy-700 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-navy-900 dark:text-white mb-2">No listings yet</h3>
            <p className="text-navy-500 dark:text-navy-400 text-sm mb-6">
              No active listings in {area.name} right now. Check back soon.
            </p>
            <Link href="/listings" className="btn-primary px-8">Browse All Listings</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l: any) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
