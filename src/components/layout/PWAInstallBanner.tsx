'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="pwa-banner animate-slide-up">
      <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Install SkyAxis</p>
        <p className="text-xs text-slate-400">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        <Download className="w-4 h-4" />
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}
