'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, MapPin, Calendar, Users, ArrowRight, ArrowLeftRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PWAInstallBanner from '@/components/layout/PWAInstallBanner';
import { useFlightStore } from '@/store';
import { AIRPORTS } from '@/types';
import type { SeatClass, SearchQuery } from '@/types';

const AIRPORT_CODES = Object.keys(AIRPORTS);
const CLASS_OPTIONS: { value: SeatClass; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

export default function HomePage() {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useFlightStore();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [origin, setOrigin] = useState(searchQuery?.origin || 'BOM');
  const [destination, setDestination] = useState(searchQuery?.destination || 'DEL');
  const [date, setDate] = useState(searchQuery?.date || defaultDate);
  const [passengers, setPassengers] = useState(searchQuery?.passengers || 1);
  const [seatClass, setSeatClass] = useState<SeatClass>(searchQuery?.class || 'economy');
  const [error, setError] = useState('');

  const swapRoutes = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleSearch = () => {
    if (origin === destination) {
      setError('Origin and destination cannot be the same');
      return;
    }
    setError('');
    const query: SearchQuery = { origin, destination, date, passengers, class: seatClass };
    setSearchQuery(query);
    router.push(`/search?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}&class=${seatClass}`);
  };

  const POPULAR_ROUTES = [
    { origin: 'BOM', destination: 'DEL' },
    { origin: 'DEL', destination: 'BLR' },
    { origin: 'BLR', destination: 'HYD' },
    { origin: 'MAA', destination: 'CCU' },
  ];

  return (
    <div className="min-h-dvh">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-sky-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
              <Plane className="w-4 h-4" />
              Real-time seat selection & instant booking
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Fly smarter
              <span className="block gradient-text">with SkyAxis</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Search hundreds of flights, select your perfect seat in real-time, and manage everything in one place.
            </p>
          </div>

          {/* Search card */}
          <div className="glass-strong rounded-3xl p-6 shadow-2xl animate-slide-up">
            {/* Class selector */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-900/50 rounded-xl w-fit">
              {CLASS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSeatClass(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    seatClass === opt.value
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin */}
              <div className="relative">
                <label className="label">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="input pl-9 appearance-none"
                  >
                    {AIRPORT_CODES.map((code) => (
                      <option key={code} value={code} className="bg-slate-800">
                        {code} — {AIRPORTS[code].city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap button (desktop) */}
              <div className="hidden lg:flex items-end pb-0.5 justify-center col-span-0">
                <button
                  onClick={swapRoutes}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors -mx-2 mt-6"
                  title="Swap routes"
                >
                  <ArrowLeftRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="label">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input pl-9 appearance-none"
                  >
                    {AIRPORT_CODES.map((code) => (
                      <option key={code} value={code} className="bg-slate-800">
                        {code} — {AIRPORTS[code].city}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Mobile swap */}
                <button
                  onClick={swapRoutes}
                  className="sm:hidden absolute -left-8 top-1/2 translate-y-1 p-1.5 rounded-lg bg-slate-700"
                >
                  <ArrowLeftRight className="w-3 h-3 text-slate-300" />
                </button>
              </div>

              {/* Date */}
              <div>
                <label className="label">Departure Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="label">Passengers</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="input pl-9 appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n} className="bg-slate-800">
                        {n} {n === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={handleSearch}
              className="mt-5 btn-primary w-full py-4 text-base flex items-center justify-center gap-2 text-lg"
            >
              <Plane className="w-5 h-5" />
              Search Flights
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Popular routes */}
          <div className="mt-8 animate-fade-in">
            <p className="text-slate-500 text-sm mb-3 text-center">Popular routes</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {POPULAR_ROUTES.map((route) => (
                <button
                  key={`${route.origin}-${route.destination}`}
                  onClick={() => {
                    setOrigin(route.origin);
                    setDestination(route.destination);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800/60 border border-white/8 text-sm text-slate-300 hover:border-white/20 hover:text-white transition-all duration-200"
                >
                  {route.origin} → {route.destination}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🗺️',
              title: 'Interactive Seat Map',
              desc: 'Visual aircraft layout with real-time availability as other passengers book',
            },
            {
              icon: '⚡',
              title: 'Instant Confirmation',
              desc: 'Get your PNR code immediately with atomic seat reservation preventing double-booking',
            },
            {
              icon: '🔄',
              title: 'Flexible Management',
              desc: 'Reschedule or cancel bookings easily with transparent fee policies',
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <PWAInstallBanner />
    </div>
  );
}
