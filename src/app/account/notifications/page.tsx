'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { notificationsAPI } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { cn } from '../../../lib/utils';
import { Bell, CheckCheck, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string; type: string; title: string; body: string;
  is_read: boolean; created_at: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [marking,       setMarking]       = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    notificationsAPI.list()
      .then(r => setNotifications(r.data.data.notifications))
      .catch(() => toast.error('Could not load notifications.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await notificationsAPI.readAll();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read.');
    } catch {
      toast.error('Could not mark as read.');
    } finally {
      setMarking(false);
    }
  };

  const markRead = async (id: string) => {
    await notificationsAPI.readOne(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20 w-full">

        <Link href="/landlord/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-amber-600 mb-6 group transition-colors">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-xl text-navy-900 dark:text-white flex items-center gap-2">
              <Bell size={20} className="text-amber-500" /> Notifications
              {unread > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unread}</span>
              )}
            </h1>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} disabled={marking}
              className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50">
              {marking ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell size={36} className="text-surface-300 dark:text-navy-700 mx-auto mb-4" />
            <p className="font-display font-bold text-navy-900 dark:text-white mb-1">No notifications yet</p>
            <p className="text-sm text-navy-500 dark:text-navy-400">You'll see boost confirmations and listing updates here.</p>
          </div>
        ) : (
          <div className="card divide-y divide-surface-50 dark:divide-navy-800 overflow-hidden">
            {notifications.map(n => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={cn('w-full flex gap-4 p-4 text-left transition-colors hover:bg-surface-25 dark:hover:bg-navy-900/50',
                  !n.is_read ? 'bg-amber-50/50 dark:bg-amber-900/5' : '')}>
                <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  n.is_read ? 'bg-transparent' : 'bg-amber-500')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', n.is_read ? 'text-navy-600 dark:text-navy-400' : 'text-navy-900 dark:text-white')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-xs text-navy-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
