'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import AdminNav from './AdminNav';
import { Loader2 } from 'lucide-react';

interface Props { children: React.ReactNode; }

export default function AdminLayout({ children }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-900">
      <AdminNav />
      <main className="flex-1 overflow-auto bg-surface-50 dark:bg-navy-950">
        {children}
      </main>
    </div>
  );
}
