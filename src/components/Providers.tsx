'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore }   from '../store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const hydrate   = useAuthStore(s => s.hydrate);
  const initTheme = useUIStore(s => s.initTheme);
  const done      = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    initTheme();
    hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
