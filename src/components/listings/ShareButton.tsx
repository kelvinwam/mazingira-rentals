'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, MessageCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  title:    string;
  price:    string;
  area:     string;
  listingId:string;
  className?:string;
}

export default function ShareButton({ title, price, area, listingId, className }: Props) {
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const BASE = typeof window !== 'undefined' ? window.location.origin : '';
  const url  = `${BASE}/listings/${listingId}`;
  const text = `Check out this rental on MachaRent: ${title} in ${area} — ${price}/mo\n${url}`;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} in ${area} — ${price}/mo`, url });
        setOpen(false);
      } catch {}
      return;
    }
    setOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setOpen(false);
  };

  const sms = () => {
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        onClick={nativeShare}
        className="w-10 h-10 rounded-xl bg-white/90 dark:bg-navy-900/90 text-navy-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 shadow-sm flex items-center justify-center transition-all"
        title="Share listing">
        <Share2 size={16} />
      </button>

      {/* Fallback dropdown for non-native share */}
      {open && (
        <div className="absolute top-12 right-0 w-52 card shadow-card-hover z-50 py-1.5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-100 dark:border-navy-800 mb-1">
            <p className="text-xs font-semibold text-navy-700 dark:text-navy-300">Share listing</p>
            <button onClick={() => setOpen(false)} className="text-navy-400 hover:text-navy-600">
              <X size={13} />
            </button>
          </div>

          <button onClick={whatsapp}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle size={13} className="text-white" />
            </div>
            WhatsApp
          </button>

          <button onClick={sms}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle size={13} className="text-white" />
            </div>
            SMS
          </button>

          <button onClick={copyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 dark:text-navy-300 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
              copied ? 'bg-emerald-500' : 'bg-surface-200 dark:bg-navy-700')}>
              {copied
                ? <Check size={13} className="text-white" />
                : <Copy size={13} className="text-navy-600 dark:text-navy-300" />}
            </div>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
