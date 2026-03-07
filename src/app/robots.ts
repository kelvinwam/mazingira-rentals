import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin/', '/landlord/', '/account/', '/messages/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
