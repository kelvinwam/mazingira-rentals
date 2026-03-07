'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [prompt,  setPrompt]  = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so it doesn't feel intrusive
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa_dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fadeUp">
      <div className="card p-4 shadow-card-hover border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🏠</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-navy-900 dark:text-white">
              Install MachaRent
            </p>
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
              Add to your home screen for faster access to listings.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold font-display rounded-lg transition-colors">
                <Download size={12} /> Install
              </button>
              <button onClick={dismiss}
                className="px-3 py-1.5 text-navy-500 dark:text-navy-400 text-xs font-medium hover:text-navy-700 dark:hover:text-navy-200 transition-colors">
                Not now
              </button>
            </div>
          </div>
          <button onClick={dismiss}
            className="text-navy-400 hover:text-navy-600 transition-colors flex-shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
