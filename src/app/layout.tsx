import type { Metadata, Viewport } from 'next';
import { Sora, Nunito } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from '../components/Providers';
import './globals.css';

const sora   = Sora({   subsets: ['latin'], variable: '--font-sora',   display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default:  'MachaRent — Find Rentals in Machakos County',
    template: '%s | MachaRent',
  },
  description: 'Discover affordable apartments and houses for rent across Machakos County — Machakos CBD, Athi River, Mlolongo, Syokimau and more. Verified listings, real photos, no agents.',
  keywords:    ['rentals Machakos', 'apartments Machakos', 'houses for rent Machakos', 'Athi River rentals', 'Syokimau apartments'],
  authors:     [{ name: 'MachaRent' }],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:           true,
    statusBarStyle:    'black-translucent',
    title:             'MachaRent',
  },
  openGraph: {
    type:        'website',
    locale:      'en_KE',
    url:          BASE,
    siteName:    'MachaRent',
    title:       'MachaRent — Find Rentals in Machakos County',
    description: 'Discover affordable apartments and houses for rent across Machakos County.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'MachaRent Rentals' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'MachaRent — Find Rentals in Machakos County',
    description: 'Discover affordable apartments and houses for rent across Machakos County.',
    images:      ['/og-default.png'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor:          [
    { media: '(prefers-color-scheme: light)', color: '#f59e0b' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f172a' },
  ],
  width:               'device-width',
  initialScale:        1,
  minimumScale:        1,
  viewportFit:         'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${sora.variable} ${nunito.variable} font-body antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                padding:      '12px 16px',
                fontSize:     '14px',
                fontFamily:   'var(--font-nunito)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
