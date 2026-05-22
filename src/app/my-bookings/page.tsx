'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TicketCheck, Plane, Calendar, RefreshCw, XCircle, Clock, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { BookingCardSkeleton } from '@/components/ui/Skeleton';
import { useUserStore, useFlightStore } from '@/store';
import { formatDateTime, formatPrice, formatDuration, isWithin2Hours } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Booking } from '@/types';

export default function MyBookingsPage() {
  const router = useRouter();
  const { setCachedBookings } = useUserStore();
  const { resetBookingFlow } = useFlightStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog state
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings');
      if (res.status === 401) {
        router.push('/auth?redirectTo=/my-bookings');
        return;
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBookings(data.bookings || []);
      setCachedBookings((data.bookings || []).map((b: Booking) => b.id));
    } catch (e) {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.bookingId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancelDialog.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      resetBookingFlow();
      await fetchBookings();
      setCancelDialog({ open: false, bookingId: null });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Cancellation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = (booking: Booking) => {
    if (!booking.flight) return;
    router.push(
      `/reschedule?bookingId=${booking.id}&origin=${booking.flight.origin}&destination=${booking.flight.destination}`
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'badge-confirmed',
      rescheduled: 'badge-rescheduled',
      cancelled: 'badge-cancelled',
      pending: 'badge-pending',
    };
    return <span className={cn('badge', map[status] || 'badge-pending')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>;
  };

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/15 rounded-xl flex items-center justify-center">
              <TicketCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">My Bookings</h1>
              <p className="text-slate-400 text-sm">
                {!loading && `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={fetchBookings}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchBookings} className="btn-primary">Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="font-display font-semibold text-xl text-white mb-2">No bookings yet</h3>
            <p className="text-slate-400 mb-6">You haven't booked any flights yet.</p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary inline-flex items-center gap-2"
            >
              Search Flights <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => {
              const within2h = booking.flight ? isWithin2Hours(booking.flight.departs_at) : false;
              const isActive = booking.status !== 'cancelled';

              return (
                <div key={booking.id} className="card p-5 animate-fade-in">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Plane className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-white">
                            {booking.flight?.origin} → {booking.flight?.destination}
                          </span>
                          {statusBadge(booking.status)}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          PNR: {booking.pnr_code} · {booking.flight?.flight_no}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-bold text-lg text-white">
                        {formatPrice(booking.total_price)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Seat {booking.seat?.seat_number}
                      </div>
                    </div>
                  </div>

                  {/* Flight details */}
                  {booking.flight && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-slate-500 text-xs">Departure</div>
                          <div className="text-white">{formatDateTime(booking.flight.departs_at)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-slate-500 text-xs">Duration</div>
                          <div className="text-white">{formatDuration(booking.flight.departs_at, booking.flight.arrives_at)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Class</div>
                        <div className="text-white capitalize">{booking.seat?.class}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Aircraft</div>
                        <div className="text-white">{booking.flight.aircraft_type}</div>
                      </div>
                    </div>
                  )}

                  {/* Within 2h warning */}
                  {within2h && isActive && (
                    <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      Departure within 2 hours — cancellation & rescheduling are no longer available
                    </div>
                  )}

                  {/* Actions */}
                  {isActive && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/8">
                      <button
                        onClick={() => handleReschedule(booking)}
                        disabled={within2h}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <RefreshCw className="w-4 h-4" /> Reschedule
                      </button>
                      <button
                        onClick={() => setCancelDialog({ open: true, bookingId: booking.id })}
                        disabled={within2h}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={cancelDialog.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone and the seat will be released."
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
        danger
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelDialog({ open: false, bookingId: null })}
      />
    </div>
  );
}
