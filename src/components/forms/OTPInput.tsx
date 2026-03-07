'use client';

import { useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface Props {
  value:    string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  error?:   boolean;
}

export default function OTPInput({ value, onChange, disabled = false, error = false }: Props) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleChange = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const next = [...value];
    next[i] = char.slice(-1);
    onChange(next);
    if (char && i < 5) refs[i + 1]?.current?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) {
        refs[i - 1]?.current?.focus();
        const next = [...value]; next[i - 1] = '';
        onChange(next);
      } else {
        const next = [...value]; next[i] = '';
        onChange(next);
      }
    }
    if (e.key === 'ArrowLeft'  && i > 0) refs[i - 1]?.current?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs[i + 1]?.current?.focus();
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    onChange(next);
    refs[Math.min(pasted.length, 5)]?.current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          disabled={disabled}
          className={cn(
            'w-11 h-12 text-center text-xl font-bold font-display rounded-xl border-2 transition-all duration-200',
            'bg-white dark:bg-navy-900 text-navy-900 dark:text-white',
            'focus:outline-none disabled:opacity-50',
            error
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
              : value[i]
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 focus:ring-2 focus:ring-amber-400/30'
                : 'border-surface-200 dark:border-navy-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30'
          )}
        />
      ))}
    </div>
  );
}
