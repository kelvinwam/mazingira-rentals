'use client';

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { reviewsAPI } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Review } from '../../types';
import toast from 'react-hot-toast';

interface Props { apartmentId: string; reviews: Review[]; }

function StarRating({ value, onChange, readonly = false, size = 22 }: {
  value: number; onChange?: (v: number) => void; readonly?: boolean; size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn('transition-all', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95')}>
          <Star size={size} className={cn('transition-colors',
            (hover || value) >= s
              ? 'fill-amber-400 text-amber-400'
              : 'fill-surface-200 text-surface-200 dark:fill-navy-700 dark:text-navy-700'
          )} />
        </button>
      ))}
    </div>
  );
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
}

export default function ReviewWidget({ apartmentId, reviews: init }: Props) {
  const [reviews,   setReviews]   = useState<Review[]>(init);
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const avg = reviews.length ? reviews.reduce((s,r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a star rating.'); return; }
    setLoading(true);
    try {
      const res = await reviewsAPI.submit(apartmentId, rating, comment.trim() || undefined);
      setReviews(prev => [{ ...res.data.data, reviewer_name: 'You' }, ...prev]);
      setRating(0); setComment(''); setSubmitted(true);
      toast.success('Thank you for your review!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-navy-900 dark:text-white">
          Reviews {reviews.length > 0 && <span className="text-navy-400 font-normal text-base">({reviews.length})</span>}
        </h3>
        {avg > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avg)} readonly size={15} />
            <span className="font-display font-bold text-navy-900 dark:text-white text-sm">{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Submit form */}
      {!submitted ? (
        <div className="card p-5 border-dashed">
          <p className="font-display font-semibold text-sm text-navy-800 dark:text-navy-200 mb-4">Leave a review</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label text-xs mb-2">Your Rating</label>
              <StarRating value={rating} onChange={setRating} size={28} />
              {!rating && <p className="text-xs text-navy-400 mt-1.5">Tap a star to rate</p>}
            </div>
            <div>
              <label className="label text-xs">
                Comment <span className="text-navy-400 font-normal">(optional)</span>
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this apartment…"
                rows={3} maxLength={1000} className="input resize-none" />
              {comment.length > 0 && (
                <p className="text-xs text-navy-400 text-right mt-1">{comment.length}/1000</p>
              )}
            </div>
            <button type="submit" disabled={loading || !rating} className="btn-primary w-full py-2.5 justify-center text-sm">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : <><Send size={15} /> Submit Review</>}
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-4 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <Star size={18} className="fill-emerald-500 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Thanks for your review! It helps others find a good home.
          </p>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star size={32} className="text-surface-300 dark:text-navy-700 mx-auto mb-2" />
          <p className="text-navy-500 dark:text-navy-400 text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 font-bold text-xs font-display">
                      {r.reviewer_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm text-navy-900 dark:text-white">
                      {r.reviewer_name || 'Anonymous'}
                    </p>
                    <StarRating value={r.rating} readonly size={12} />
                  </div>
                </div>
                <span className="text-xs text-navy-400 flex-shrink-0 mt-1">{timeAgo(r.created_at)}</span>
              </div>
              {r.body && (
                <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed mt-2 pl-10">{r.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
