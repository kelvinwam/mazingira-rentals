'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { wishlistAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  apartmentId: string;
  className?:  string;
  size?:       'sm' | 'md';
}

export default function WishlistButton({ apartmentId, className, size = 'md' }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setChecked(true); return; }
    wishlistAPI.check(apartmentId)
      .then(r => setSaved(r.data.data.saved))
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [apartmentId, isAuthenticated]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast('Sign in to save listings', { icon: '🔒' });
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      if (saved) {
        await wishlistAPI.remove(apartmentId);
        setSaved(false);
        toast('Removed from wishlist');
      } else {
        await wishlistAPI.save(apartmentId);
        setSaved(true);
        toast.success('Saved to wishlist!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update wishlist.');
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  const s = size === 'sm' ? 14 : 18;

  return (
    <button onClick={toggle} disabled={loading}
      className={cn(
        'flex items-center justify-center rounded-xl transition-all duration-200',
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10',
        saved
          ? 'bg-rose-500 text-white shadow-md hover:bg-rose-600'
          : 'bg-white/90 dark:bg-navy-900/90 text-navy-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 shadow-sm',
        className
      )}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
      {loading
        ? <Loader2 size={s} className="animate-spin" />
        : <Heart size={s} className={saved ? 'fill-white' : ''} />}
    </button>
  );
}
