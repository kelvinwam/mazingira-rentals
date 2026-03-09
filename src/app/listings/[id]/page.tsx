'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar         from '../../../components/layout/Navbar';
import Footer         from '../../../components/layout/Footer';
import ReviewWidget   from '../../../components/listings/ReviewWidget';
import WishlistButton from '../../../components/listings/WishlistButton';
import ShareButton    from '../../../components/listings/ShareButton';
import { listingsAPI, messagesAPI } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { cn, formatKES } from '../../../lib/utils';
import type { ListingDetail } from '../../../types';
import {
  MapPin, Bed, Bath, Phone, MessageSquare, ShieldCheck,
  ChevronLeft, ChevronRight, Star, Eye, ArrowLeft,
  Loader2, Flag, Send, Home, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ListingDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [listing,    setListing]    = useState<ListingDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [imgIdx,     setImgIdx]     = useState(0);
  const [msgText,    setMsgText]    = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSent,    setMsgSent]    = useState(false);

  useEffect(() => {
    listingsAPI.detail(id)
      .then(r => setListing(r.data.data))
      .catch(() => setError('Listing not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast('Sign in to message the landlord', { icon: '🔒' }); router.push('/auth/login'); return; }
    if (!msgText.trim()) return;
    setMsgLoading(true);
    try {
      const res = await messagesAPI.start(id, msgText.trim());
      setMsgSent(true);
      toast.success('Message sent!');
      router.push(`/messages/${res.data.data.inquiry.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send message.');
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-navy-950">
      <Loader2 size={36} className="animate-spin text-amber-500" />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-navy-950 px-4 text-center">
      <Building2 size={40} className="text-navy-300 dark:text-navy-700 mb-4" />
      <p className="text-navy-500 dark:text-navy-400 mb-5">{error}</p>
      <Link href="/listings" className="btn-primary">← Back to listings</Link>
    </div>
  );

  const imgs    = listing.images || [];
  const curImg  = imgs[imgIdx]?.url || '';
  const grouped = (listing.amenities || []).reduce((acc: Record<string, typeof listing.amenities>, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});

  const waMsgRaw = `Hi, I'm interested in your listing "${listing.title}" on MachaRent. Is it still available?`;
  const waMsg    = encodeURIComponent(waMsgRaw);
  const waPhone  = listing.landlord_phone.replace('+', '');
  const isOwner  = user?.id === (listing as any).landlord_id;

  // Short title for the sticky card (max 40 chars)
  const shortTitle = listing.title.length > 40
    ? listing.title.slice(0, 40).trim() + '…'
    : listing.title;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-navy-400 mb-5 flex-wrap">
          <Link href="/" className="hover:text-amber-500 transition-colors flex items-center gap-1">
            <Home size={11} /> Home
          </Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-amber-500 transition-colors">Listings</Link>
          <span>/</span>
          <Link href={`/areas/${listing.area_slug}`} className="hover:text-amber-500 transition-colors">
            {listing.area_name}
          </Link>
          <span>/</span>
          <span className="text-navy-600 dark:text-navy-300 truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image carousel */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-surface-200 dark:bg-navy-800">
              {curImg ? (
                <Image src={curImg} alt={listing.title} fill
                  sizes="(max-width: 768px) 100vw, 66vw" className="object-cover" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-navy-400 text-sm">
                  No photos yet
                </div>
              )}

              {imgs.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors">
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imgs.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={cn('h-1.5 rounded-full transition-all',
                          i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50')} />
                    ))}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-medium">
                    {imgIdx + 1} / {imgs.length}
                  </div>
                </>
              )}

              {/* Availability badge */}
              <div className={cn('absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold font-display',
                listing.is_available ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
                {listing.is_available ? 'Available' : 'Taken'}
              </div>

              {/* Share + Wishlist */}
              {!isOwner && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <ShareButton
                    listingId={listing.id}
                    title={listing.title}
                    price={formatKES(listing.price_kes)}
                    area={listing.area_name}
                  />
                  <WishlistButton apartmentId={listing.id} />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imgs.map((img, i) => (
                  <button key={img.id} onClick={() => setImgIdx(i)}
                    className={cn('flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
                      i === imgIdx ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100')}>
                    <Image src={img.thumbnail_url || img.url} alt="" width={64} height={64}
                      className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & meta */}
            <div>
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <h1 className="font-display font-bold text-2xl text-navy-900 dark:text-white flex-1 leading-snug">
                  {listing.title}
                </h1>
                {listing.verification_level !== 'UNVERIFIED' && (
                  <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0',
                    listing.verification_level === 'IN_PERSON_VERIFIED'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400')}>
                    <ShieldCheck size={12} />
                    {listing.verification_level === 'IN_PERSON_VERIFIED' ? 'In-Person Verified' : 'Phone Verified'}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-500 dark:text-navy-400 mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-500" />
                  {listing.address_hint || listing.area_name}
                </span>
                {listing.bedrooms  != null && (
                  <span className="flex items-center gap-1.5"><Bed  size={14} />{listing.bedrooms} bed</span>
                )}
                {listing.bathrooms != null && (
                  <span className="flex items-center gap-1.5"><Bath size={14} />{listing.bathrooms} bath</span>
                )}
                <span className="flex items-center gap-1.5"><Eye size={14} />{listing.view_count} views</span>
                {listing.avg_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {Number(listing.avg_rating).toFixed(1)} ({listing.review_count})
                  </span>
                )}
              </div>

              {/* Price summary row — visible on mobile before sticky card */}
              <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl mb-4 lg:hidden">
                <div>
                  <p className="font-display font-extrabold text-xl text-amber-600 dark:text-amber-400">
                    {formatKES(listing.price_kes)}
                    <span className="text-xs font-normal text-navy-400">/mo</span>
                  </p>
                  {listing.deposit_kes > 0 && (
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                      Deposit: {formatKES(listing.deposit_kes)}
                    </p>
                  )}
                </div>
                {!isOwner && (
                  <a href={`tel:${listing.landlord_phone}`}
                    className="ml-auto btn-primary px-4 py-2 text-sm">
                    <Phone size={14} /> Call
                  </a>
                )}
              </div>

              <p className="text-navy-600 dark:text-navy-300 leading-relaxed text-sm whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Key details card */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">Property Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {listing.bedrooms != null && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                      <Bed size={15} className="text-navy-500 dark:text-navy-400" />
                    </div>
                    <div>
                      <p className="text-xs text-navy-400">Bedrooms</p>
                      <p className="font-semibold text-sm text-navy-900 dark:text-white">{listing.bedrooms}</p>
                    </div>
                  </div>
                )}
                {listing.bathrooms != null && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                      <Bath size={15} className="text-navy-500 dark:text-navy-400" />
                    </div>
                    <div>
                      <p className="text-xs text-navy-400">Bathrooms</p>
                      <p className="font-semibold text-sm text-navy-900 dark:text-white">{listing.bathrooms}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                    <MapPin size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-navy-400">Area</p>
                    <p className="font-semibold text-sm text-navy-900 dark:text-white">{listing.area_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">KES</span>
                  </div>
                  <div>
                    <p className="text-xs text-navy-400">Monthly Rent</p>
                    <p className="font-semibold text-sm text-navy-900 dark:text-white">{formatKES(listing.price_kes)}</p>
                  </div>
                </div>
                {listing.deposit_kes > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-navy-500 dark:text-navy-400 font-bold text-xs">DEP</span>
                    </div>
                    <div>
                      <p className="text-xs text-navy-400">Deposit</p>
                      <p className="font-semibold text-sm text-navy-900 dark:text-white">{formatKES(listing.deposit_kes)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-surface-100 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                    <Eye size={15} className="text-navy-500 dark:text-navy-400" />
                  </div>
                  <div>
                    <p className="text-xs text-navy-400">Views</p>
                    <p className="font-semibold text-sm text-navy-900 dark:text-white">{listing.view_count}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {Object.keys(grouped).length > 0 && (
              <div className="card p-5">
                <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-4">What's Included</h3>
                <div className="space-y-4">
                  {Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2 capitalize">{cat}</p>
                      <div className="flex flex-wrap gap-2">
                        {items.map(a => (
                          <span key={a.id}
                            className="px-3 py-1.5 bg-surface-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 text-xs rounded-lg font-medium">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-navy-900 dark:text-white mb-3">Location</h3>
              <a href={`https://www.google.com/maps?q=${parseFloat(String(listing.latitude)).toFixed(6)},${parseFloat(String(listing.longitude)).toFixed(6)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-navy-800 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-navy-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Open in Google Maps
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {listing.area_name} · {parseFloat(String(listing.latitude)).toFixed(4)}, {parseFloat(String(listing.longitude)).toFixed(4)}
                  </p>
                </div>
              </a>
            </div>

            {/* Reviews */}
            <div className="card p-5">
              <ReviewWidget apartmentId={listing.id} reviews={listing.reviews || []} />
            </div>

            {/* Report */}
            <div className="flex justify-end">
              <button className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-red-500 transition-colors">
                <Flag size={12} /> Report this listing
              </button>
            </div>
          </div>

          {/* RIGHT sticky card */}
          <div className="lg:col-span-1">
            <div className="card p-5 lg:sticky lg:top-24 space-y-4">

              {/* Apartment name in card */}
              <div className="pb-1">
                <p className="text-xs text-navy-400 uppercase tracking-wider font-semibold mb-1">Property</p>
                <p className="font-display font-bold text-sm text-navy-900 dark:text-white leading-snug">
                  {shortTitle}
                </p>
                <Link href={`/areas/${listing.area_slug}`}
                  className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline mt-1">
                  <MapPin size={10} /> {listing.area_name}
                </Link>
              </div>

              <div className="h-px bg-surface-100 dark:bg-navy-800" />

              {/* Price */}
              <div>
                <p className="text-2xl font-display font-extrabold text-navy-900 dark:text-white">
                  {formatKES(listing.price_kes)}
                  <span className="text-sm text-navy-400 font-normal"> / month</span>
                </p>
                {listing.deposit_kes > 0 && (
                  <div className="flex items-center justify-between mt-1.5 text-sm">
                    <span className="text-navy-500 dark:text-navy-400">Deposit</span>
                    <span className="font-semibold text-navy-700 dark:text-navy-200">{formatKES(listing.deposit_kes)}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-surface-100 dark:bg-navy-800" />

              {/* Landlord */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-amber-600 dark:text-amber-400 text-sm">
                    {listing.landlord_name?.[0]?.toUpperCase() || 'L'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-navy-900 dark:text-white">
                    {listing.landlord_name || 'Landlord'}
                  </p>
                  <p className="text-xs text-navy-400">Property owner</p>
                </div>
              </div>

              {/* Contact buttons — only for non-owners */}
              {!isOwner && (
                <>
                  <a href={`tel:${listing.landlord_phone}`} className="btn-primary w-full py-3 justify-center">
                    <Phone size={16} /> Call Landlord
                  </a>
                  <a href={`https://wa.me/${waPhone}?text=${waMsg}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold font-display text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-md">
                    <MessageSquare size={16} /> WhatsApp
                  </a>

                  <div className="h-px bg-surface-100 dark:bg-navy-800" />

                  {/* In-app message */}
                  {!msgSent ? (
                    <form onSubmit={sendMessage} className="space-y-2">
                      <p className="text-xs font-semibold text-navy-700 dark:text-navy-300">Message Landlord</p>
                      <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                        placeholder="Hi, is this apartment still available?"
                        rows={3} className="input resize-none text-sm w-full" />
                      <button type="submit" disabled={msgLoading || !msgText.trim()}
                        className="btn-secondary w-full py-2.5 justify-center text-sm disabled:opacity-50">
                        {msgLoading
                          ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                          : <><Send size={14} /> Send Message</>}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Message sent!</p>
                      <Link href="/messages" className="text-xs text-amber-600 hover:underline mt-1 block">
                        View in Messages →
                      </Link>
                    </div>
                  )}

                  <div className="h-px bg-surface-100 dark:bg-navy-800" />

                  {/* Wishlist + Share */}
                  <div className="flex gap-2">
                    <WishlistButton apartmentId={listing.id} size="sm"
                      className="flex-1 !rounded-xl !h-9 gap-2 text-sm font-medium" />
                    <ShareButton
                      listingId={listing.id}
                      title={listing.title}
                      price={formatKES(listing.price_kes)}
                      area={listing.area_name}
                    />
                  </div>
                </>
              )}

              <div className="h-px bg-surface-100 dark:bg-navy-800" />

              <Link href={`/listings?area=${listing.area_slug}`}
                className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 hover:text-amber-500 transition-colors">
                <MapPin size={14} className="text-amber-500" />
                More listings in {listing.area_name}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
