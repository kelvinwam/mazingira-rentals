import { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_routes: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE}/listings`, lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/auth/login`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const [listingsRes, areasRes] = await Promise.all([
      fetch(`${API}/listings?limit=200&status=ACTIVE`).then(r => r.json()),
      fetch(`${API}/areas`).then(r => r.json()),
    ]);

    const listingUrls: MetadataRoute.Sitemap = (listingsRes.data || []).map((l: any) => ({
      url:             `${BASE}/listings/${l.id}`,
      lastModified:    new Date(l.updated_at || l.created_at),
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }));

    const areaUrls: MetadataRoute.Sitemap = (areasRes.data || []).map((a: any) => ({
      url:             `${BASE}/areas/${a.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'daily' as const,
      priority:        0.7,
    }));

    return [...static_routes, ...listingUrls, ...areaUrls];
  } catch {
    return static_routes;
  }
}
