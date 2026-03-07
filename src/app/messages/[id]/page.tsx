'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import InboxList from '@/components/messages/InboxList';
import MessageThread from '@/components/messages/MessageThread';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessageThreadPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
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
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-20 pb-4 flex flex-col">
        {/* Mobile back button */}
        <div className="md:hidden flex items-center gap-2 py-3">
          <Link href="/messages"
            className="flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 transition-colors">
            <ArrowLeft size={15} /> All Messages
          </Link>
        </div>

        <div className="flex-1 flex gap-0 card overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>

          {/* Left sidebar — inbox list (hidden on mobile) */}
          <div className="hidden md:flex md:w-80 border-r border-surface-100 dark:border-navy-800 flex-col flex-shrink-0">
            <div className="p-4 border-b border-surface-100 dark:border-navy-800">
              <h2 className="font-display font-bold text-base text-navy-900 dark:text-white">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={22} className="animate-spin text-amber-500" />
                </div>
              ) : (
                <InboxList inquiries={inquiries} activeId={id} />
              )}
            </div>
          </div>

          {/* Right panel — message thread */}
          <div className="flex-1 flex flex-col min-w-0">
            <MessageThread inquiryId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
