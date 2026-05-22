'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, RefreshCw } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import FlightCard from '@/components/flight/FlightCard';
import SeatMap from '@/components/seat/SeatMap';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FlightCardSkeleton } from '@/components/ui/Skeleton';
import { AIRPORTS } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Flight, Seat } from '@/types';

function RescheduleContent() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get('bookingId') || '';
  const origin = params.get('origin') || '';
  const destination = params.get('destination') || '';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fee, setFee] = useState<number | null>(null);

  useEffect(() => {
    if (origin && destination && date) searchFlights();
  }, [date]);

  const searchFlights = async () => {
    setLoadingFlights(true);
    setFlights([]);
    setSelectedFlight(null);
    setSelectedSeat(null);
    const res = await fetch(`/api/flights?origin=${origin}&destination=${destination}&date=${date}`);
    const data = await res.json();
    setFlights(data.flights || []);
    setLoadingFlights(false);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedFlight || !selectedSeat) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          new_flight_id: selectedFlight.id,
          new_seat_id: selectedSeat.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFee(data.fee_charged);
      setConfirmOpen(false);
      router.push('/my-bookings');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Reschedule failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-sky-400" />
              Reschedule Flight
            </h1>
            <p className="text-slate-400 text-sm">
              {AIRPORTS[origin]?.city} → {AIRPORTS[destination]?.city}
            </p>
          </div>
        </div>

        {/* Date picker */}
        <div className="card p-5 mb-6">
          <label className="label">Select New Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="input max-w-xs"
          />
        </div>

        {/* Available flights */}
        <div className="mb-6">
          <h2 className="font-display font-semibold text-white mb-4">Available Flights</h2>
          {loadingFlights ? (
            <div className="flex flex-col gap-4">{[1, 2].map((i) => <FlightCardSkeleton key={i} />)}</div>
          ) : flights.length === 0 ? (
            <div className="card p-8 text-center">
              <Plane className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No flights available for this date</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {flights.map((f) => (
                <div key={f.id} className={`rounded-2xl transition-all duration-200 ${selectedFlight?.id === f.id ? 'ring-2 ring-sky-500' : ''}`}>
                  <FlightCard
                    flight={f}
                    selectedClass="economy"
                    onSelect={(fl) => {
                      setSelectedFlight(fl);
                      setSelectedSeat(null);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seat selection for chosen flight */}
        {selectedFlight && (
          <div className="card p-6 mb-6">
            <h2 className="font-display font-semibold text-white mb-4">Select New Seat</h2>
            <SeatMap
              flightId={selectedFlight.id}
              selectedSeatId={selectedSeat?.id || null}
              optimisticSeatId={null}
              onSeatSelect={(seat) => setSelectedSeat(seat)}
            />
          </div>
        )}

        {/* Confirm button */}
        {selectedFlight && selectedSeat && (
          <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">
                New: {selectedFlight.flight_no} · Seat {selectedSeat.seat_number}
              </p>
              <p className="text-slate-400 text-sm">{formatDate(selectedFlight.departs_at)}</p>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Confirm Reschedule
            </button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Reschedule"
        message={`You're rescheduling to ${selectedFlight?.flight_no} on ${selectedFlight ? formatDate(selectedFlight.departs_at) : ''}. A fee may apply if the new flight is more expensive.`}
        confirmLabel="Confirm Reschedule"
        loading={actionLoading}
        onConfirm={handleConfirmReschedule}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function ReschedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RescheduleContent />
    </Suspense>
  );
}
