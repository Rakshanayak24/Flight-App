'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md animate-slide-up shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            danger ? 'bg-red-500/15' : 'bg-sky-500/15'
          )}>
            <AlertTriangle className={cn('w-5 h-5', danger ? 'text-red-400' : 'text-sky-400')} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary py-2 px-4 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
              danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'btn-primary'
            )}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
