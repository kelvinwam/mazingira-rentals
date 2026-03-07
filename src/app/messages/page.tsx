'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import InboxList from '@/components/messages/InboxList';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [inquiries, setInquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    messagesAPI.list()
      .then(r => setInquiries(r.data.data))
      .catch(() => toast.error('Could not load messages.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <h1 className="font-display font-extrabold text-2xl text-navy-900 dark:text-white mb-6">Messages</h1>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-amber-500" />
            </div>
          ) : (
            <InboxList inquiries={inquiries} />
          )}
        </div>
      </div>
    </div>
  );
}
