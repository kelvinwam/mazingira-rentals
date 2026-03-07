import { Metadata } from 'next';

const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/v1';
const BASE = process.env.NEXT_PUBLIC_APP_URL  || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res  = await fetch(`${API}/listings/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Listing Not Found' };
    const data = await res.json();
    const l    = data.data;

    const price = l.price_kes
      ? `KES ${parseInt(l.price_kes).toLocaleString()}/mo`
      : '';
    const beds  = l.bedrooms  ? `${l.bedrooms} bed` : '';
    const baths = l.bathrooms ? `${l.bathrooms} bath` : '';
    const desc  = [l.area_name, price, beds, baths].filter(Boolean).join(' · ');

    const img   = l.images?.[0]?.url;

    return {
      title:       l.title,
      description: `${l.title} in ${l.area_name}, Machakos County. ${price}. ${l.description?.slice(0, 120) || ''}`,
      openGraph: {
        title:       `${l.title} | MachaRent`,
        description: desc,
        url:          `${BASE}/listings/${params.id}`,
        images:       img ? [{ url: img, width: 1200, height: 900, alt: l.title }] : [],
      },
      twitter: {
        card:        'summary_large_image',
        title:       l.title,
        description: desc,
        images:      img ? [img] : [],
      },
    };
  } catch {
    return { title: 'Listing' };
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
