'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plane, Search } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import FlightCard from '@/components/flight/FlightCard';
import { FlightCardSkeleton } from '@/components/ui/Skeleton';
import { useFlightStore } from '@/store';
import { AIRPORTS } from '@/types';
import type { Flight, SeatClass } from '@/types';

function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSelectedFlight, setCurrentStep } = useFlightStore();

  const origin = params.get('origin') || '';
  const destination = params.get('destination') || '';
  const date = params.get('date') || '';
  const passengers = Number(params.get('passengers') || 1);
  const seatClass = (params.get('class') || 'economy') as SeatClass;

  const [flights, setFlights] = useState<Flight[]>([]);
  const [seatCounts, setSeatCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!origin || !destination || !date) return;
    fetchFlights();
  }, [origin, destination, date]);

  const fetchFlights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/flights?origin=${origin}&destination=${destination}&date=${date}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFlights(data.flights || []);

      // Fetch seat availability counts
      const counts: Record<string, number> = {};
      await Promise.all(
        (data.flights || []).map(async (f: Flight) => {
          const r = await fetch(`/api/seats/count?flightId=${f.id}&class=${seatClass}`);
          const d = await r.json();
          counts[f.id] = d.count || 0;
        })
      );
      setSeatCounts(counts);
    } catch (e) {
      setError('Failed to load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setCurrentStep(2);
    router.push(`/seat-selection?flightId=${flight.id}`);
  };

  const originInfo = AIRPORTS[origin];
  const destInfo = AIRPORTS[destination];

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              {origin}
              <Plane className="w-5 h-5 text-sky-500 mx-1" />
              {destination}
            </h1>
            <p className="text-slate-400 text-sm">
              {originInfo?.city} → {destInfo?.city} · {date} · {passengers} pax · {seatClass.charAt(0).toUpperCase() + seatClass.slice(1)}
            </p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <FlightCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchFlights} className="btn-primary">Retry</button>
          </div>
        ) : flights.length === 0 ? (
          <div className="card p-12 text-center">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-white mb-2">No flights found</h3>
            <p className="text-slate-400 mb-6">No flights available for this route and date.</p>
            <Link href="/" className="btn-primary inline-flex">Search again</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-slate-400 text-sm">
              {flights.length} flight{flights.length !== 1 ? 's' : ''} available
            </p>
            {flights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                selectedClass={seatClass}
                availableSeats={seatCounts[flight.id]}
                onSelect={handleSelectFlight}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
