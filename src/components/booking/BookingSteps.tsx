'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { n: 1, label: 'Search' },
  { n: 2, label: 'Select Seat' },
  { n: 3, label: 'Passenger Details' },
  { n: 4, label: 'Confirmation' },
];

export default function BookingSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-xl mx-auto">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                current > step.n
                  ? 'bg-emerald-500 text-white'
                  : current === step.n
                  ? 'bg-sky-500 text-white ring-4 ring-sky-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              )}
            >
              {current > step.n ? <Check className="w-4 h-4" /> : step.n}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block whitespace-nowrap',
                current >= step.n ? 'text-white' : 'text-slate-500'
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                'h-0.5 flex-1 mx-2 transition-all duration-300',
                current > step.n ? 'bg-emerald-500' : 'bg-slate-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
