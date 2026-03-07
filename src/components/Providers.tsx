'use client';

import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useUIStore }   from '../store/uiStore';
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt';
import ScrollToTop      from '../components/ui/ScrollToTop';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const hydrated   = useRef(false);
  const { hydrate }   = useAuthStore();
  const { initTheme } = useUIStore();

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    hydrate();
    initTheme();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PWAInstallPrompt />
      <ScrollToTop />
    </QueryClientProvider>
  );
}
