'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Plane, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BookingSteps from '@/components/booking/BookingSteps';
import { useFlightStore } from '@/store';
import { formatDateTime, formatPrice, formatDuration } from '@/lib/utils';
import type { Booking } from '@/types';

function ConfirmationContent() {
  const params = useSearchParams();
  const bookingId = params.get('bookingId');
  const pnr = params.get('pnr');

  const { selectedFlight, selectedSeat, resetBookingFlow } = useFlightStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d.booking);
        setLoading(false);
        resetBookingFlow();
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  const flight = booking?.flight || selectedFlight;
  const seat = booking?.seat || selectedSeat;
  const passenger = booking?.passengers?.[0];

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <BookingSteps current={4} />
        </div>

        {/* Success animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Booking Confirmed!</h1>
          <p className="text-slate-400">Your seat has been reserved. Have a great flight!</p>
        </div>

        {/* PNR Card */}
        <div className="card overflow-hidden mb-6 animate-slide-up">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />

          <div className="p-6">
            {/* PNR */}
            <div className="text-center mb-6 pb-6 border-b border-white/8">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Booking Reference (PNR)</p>
              <div className="text-4xl font-mono font-black text-white tracking-[0.3em] bg-slate-900/50 rounded-xl px-6 py-4 inline-block">
                {pnr || booking?.pnr_code}
              </div>
            </div>

            {/* Flight details */}
            {flight && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="font-display font-bold text-3xl text-white">{flight.origin}</div>
                    <div className="text-sm text-slate-400">{formatDateTime(flight.departs_at)}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1 px-4">
                    <div className="text-xs text-slate-500">{formatDuration(flight.departs_at, flight.arrives_at)}</div>
                    <div className="flex items-center w-full">
                      <div className="h-px bg-slate-700 flex-1" />
                      <Plane className="w-4 h-4 text-sky-500 mx-2" />
                      <div className="h-px bg-slate-700 flex-1" />
                    </div>
                    <div className="text-xs text-slate-600 font-mono">{flight.flight_no}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display font-bold text-3xl text-white">{flight.destination}</div>
                    <div className="text-sm text-slate-400">{formatDateTime(flight.arrives_at)}</div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Seat', value: seat?.seat_number || '—', mono: true },
                    { label: 'Class', value: (seat?.class || '—').charAt(0).toUpperCase() + (seat?.class || '').slice(1) },
                    { label: 'Aircraft', value: flight.aircraft_type },
                    { label: 'Status', value: 'Confirmed', green: true },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-900/40 rounded-xl p-3 text-center">
                      <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                      <div className={`font-semibold text-sm ${item.green ? 'text-emerald-400' : 'text-white'} ${item.mono ? 'font-mono' : ''}`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Passenger */}
            {passenger && (
              <div className="border-t border-white/8 pt-5 mb-5">
                <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3">Passenger</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Name:</span>{' '}
                    <span className="text-white">{passenger.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Nationality:</span>{' '}
                    <span className="text-white">{passenger.nationality}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Price */}
            {booking?.total_price && (
              <div className="border-t border-white/8 pt-4 flex justify-between items-center">
                <span className="text-slate-400">Total Paid</span>
                <span className="text-2xl font-display font-bold text-white">
                  {formatPrice(booking.total_price)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
          <Link href="/my-bookings" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
            View My Bookings <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/" className="btn-secondary flex-1 text-center">
            Book Another Flight
          </Link>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          A confirmation has been recorded to your account. Screenshot your PNR for reference.
        </p>
      </main>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
