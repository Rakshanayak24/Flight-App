'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BookingSteps from '@/components/booking/BookingSteps';
import SeatMap from '@/components/seat/SeatMap';
import { useFlightStore } from '@/store';
import { formatPrice } from '@/lib/utils';
import type { Flight, Seat } from '@/types';

function SeatSelectionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const flightId = params.get('flightId') || '';

  const {
    selectedFlight,
    setSelectedFlight,
    selectedSeat,
    setSelectedSeat,
    optimisticSeatId,
    setOptimisticSeat,
    setCurrentStep,
    searchQuery,
  } = useFlightStore();

  const [flight, setFlight] = useState<Flight | null>(selectedFlight);

  useEffect(() => {
    if (!flightId) return;
    if (!selectedFlight || selectedFlight.id !== flightId) {
      // Fetch flight if not in store
      fetch(`/api/flights/${flightId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.flight) {
            setFlight(d.flight);
            setSelectedFlight(d.flight);
          }
        });
    }
    setCurrentStep(2);
  }, [flightId]);

  const handleSeatSelect = (seat: Seat) => {
    // Optimistic selection
    setOptimisticSeat(seat.id);
    setSelectedSeat(seat);
  };

  const handleContinue = () => {
    if (!selectedSeat) return;
    setCurrentStep(3);
    router.push('/booking');
  };

  const seatClass = searchQuery?.class || 'economy';

  const extraFee = selectedSeat?.extra_fee || 0;
  const basePrice = flight
    ? flight.base_price * (seatClass === 'economy' ? 1 : seatClass === 'business' ? 2.5 : 4.5)
    : 0;
  const totalPrice = basePrice + extraFee;

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Steps */}
        <div className="mb-8">
          <BookingSteps current={2} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/search" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Select Your Seat</h1>
            {flight && (
              <p className="text-slate-400 text-sm">
                {flight.flight_no} · {flight.origin} → {flight.destination}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat map */}
          <div className="lg:col-span-2 card p-6 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-sky-400" />
              <p className="text-xs text-slate-400">
                Seats update in real-time. Tap a seat to select.
              </p>
            </div>
            {flightId && (
              <SeatMap
                flightId={flightId}
                selectedSeatId={selectedSeat?.id || null}
                optimisticSeatId={optimisticSeatId}
                onSeatSelect={handleSeatSelect}
              />
            )}
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-display font-semibold text-white mb-4">Booking Summary</h3>

              {selectedSeat ? (
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Selected Seat</span>
                    <span className="font-bold text-white font-mono">{selectedSeat.seat_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Class</span>
                    <span className="text-white capitalize">{selectedSeat.class}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Base fare</span>
                    <span className="text-white">{formatPrice(basePrice)}</span>
                  </div>
                  {extraFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Seat upgrade</span>
                      <span className="text-amber-400">+{formatPrice(extraFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/8 pt-3 flex justify-between">
                    <span className="text-slate-300 font-medium">Total</span>
                    <span className="text-xl font-bold font-display text-white">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm mb-5">
                  <div className="text-3xl mb-2">💺</div>
                  No seat selected yet
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!selectedSeat}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SeatSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SeatSelectionContent />
    </Suspense>
  );
}
