import Navbar from '../../components/layout/Navbar';
import Link   from 'next/link';

export default function ListingsPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-navy-900 dark:text-white mb-3">
          Browse Listings
        </h1>
        <p className="text-navy-500 dark:text-navy-400 mb-8 max-w-sm mx-auto">
          Coming in Stage 2 — the full browsing experience with filters, map, and more.
        </p>
        <Link href="/" className="btn-secondary inline-flex">
          ← Back Home
        </Link>
      </div>
    </div>
  );
}
