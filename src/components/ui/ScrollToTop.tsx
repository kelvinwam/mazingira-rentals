'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-6 z-40 w-10 h-10 rounded-xl',
        'bg-amber-500 hover:bg-amber-600 text-white shadow-lg',
        'flex items-center justify-center transition-all duration-200',
        'animate-fadeIn'
      )}
      title="Back to top">
      <ChevronUp size={18} />
    </button>
  );
}
