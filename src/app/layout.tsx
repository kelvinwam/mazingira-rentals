import type { Metadata, Viewport } from 'next';
import { Toaster }  from 'react-hot-toast';
import Providers    from '../components/Providers';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { template: '%s | Mazingira', default: 'Mazingira — Find Your Home in Machakos' },
  description: "Machakos County's trusted rental marketplace. Verified, scam-free apartments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Nunito, sans-serif', fontSize: '14px', borderRadius: '12px' },
            success: { style: { background: '#10B981', color: '#fff' } },
            error:   { style: { background: '#EF4444', color: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
