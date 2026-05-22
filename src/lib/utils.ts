import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInMinutes, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm');
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm');
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy');
}

export function formatDuration(departsAt: string, arrivesAt: string): string {
  const mins = differenceInMinutes(parseISO(arrivesAt), parseISO(departsAt));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function generatePNR(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

export function isWithin2Hours(departsAt: string): boolean {
  const now = new Date();
  const departure = parseISO(departsAt);
  const diffMins = differenceInMinutes(departure, now);
  return diffMins <= 120 && diffMins >= 0;
}
