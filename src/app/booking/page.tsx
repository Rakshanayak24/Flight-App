'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, CreditCard, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BookingSteps from '@/components/booking/BookingSteps';
import { useFlightStore } from '@/store';
import { formatPrice, formatTime, formatDate, formatDuration } from '@/lib/utils';
import type { PassengerFormData } from '@/types';

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Australian', 'Canadian', 'German',
  'French', 'Japanese', 'Chinese', 'Singaporean', 'UAE', 'Other',
];

export default function BookingPage() {
  const router = useRouter();
  const {
    selectedFlight,
    selectedSeat,
    searchQuery,
    setCurrentStep,
    setPassengerData,
    passengerData,
  } = useFlightStore();

  const [form, setForm] = useState<PassengerFormData>({
    full_name: passengerData?.full_name || '',
    passport_no: passengerData?.passport_no || '',
    nationality: passengerData?.nationality || 'Indian',
    dob: passengerData?.dob || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PassengerFormData>>({});

  useEffect(() => {
    setCurrentStep(3);
    if (!selectedFlight || !selectedSeat) {
      router.push('/');
    }
  }, []);

  const validate = (): boolean => {
    const e: Partial<PassengerFormData> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.passport_no.trim()) e.passport_no = 'Passport number is required';
    if (!form.nationality) e.nationality = 'Nationality is required';
    if (!form.dob) e.dob = 'Date of birth is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    // Save form data (passport excluded from store persist via partialize)
    setPassengerData(form);

    // Proceed to confirm
    const seatClass = searchQuery?.class || 'economy';
    const basePrice = selectedFlight!.base_price * (seatClass === 'economy' ? 1 : seatClass === 'business' ? 2.5 : 4.5);
    const totalPrice = basePrice + (selectedSeat?.extra_fee || 0);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_id: selectedFlight!.id,
          seat_id: selectedSeat!.id,
          total_price: totalPrice,
          passenger: form,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentStep(4);
      router.push(`/confirmation?bookingId=${data.booking_id}&pnr=${data.pnr_code}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const seatClass = searchQuery?.class || 'economy';
  const basePrice = selectedFlight
    ? selectedFlight.base_price * (seatClass === 'economy' ? 1 : seatClass === 'business' ? 2.5 : 4.5)
    : 0;
  const totalPrice = basePrice + (selectedSeat?.extra_fee || 0);

  if (!selectedFlight || !selectedSeat) return null;

  return (
    <div className="min-h-dvh page-enter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <BookingSteps current={3} />
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <h1 className="font-display font-bold text-2xl text-white">Passenger Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-sky-500/15 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-sky-400" />
              </div>
              <h2 className="font-display font-semibold text-white">Passenger 1</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full name */}
              <div className="sm:col-span-2">
                <label className="label">Full Name (as on passport)</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="input pl-9"
                  />
                </div>
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
              </div>

              {/* Passport */}
              <div>
                <label className="label">Passport Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.passport_no}
                    onChange={(e) => setForm({ ...form, passport_no: e.target.value.toUpperCase() })}
                    placeholder="A1234567"
                    className="input pl-9 font-mono"
                  />
                </div>
                {errors.passport_no && <p className="text-red-400 text-xs mt-1">{errors.passport_no}</p>}
              </div>

              {/* Nationality */}
              <div>
                <label className="label">Nationality</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="input pl-9 appearance-none"
                  >
                    {NATIONALITIES.map((n) => (
                      <option key={n} value={n} className="bg-slate-800">{n}</option>
                    ))}
                  </select>
                </div>
                {errors.nationality && <p className="text-red-400 text-xs mt-1">{errors.nationality}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className="label">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={form.dob}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="input pl-9"
                  />
                </div>
                {errors.dob && <p className="text-red-400 text-xs mt-1">{errors.dob}</p>}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-sky-500/5 border border-sky-500/15 text-xs text-slate-400">
              🔒 Your passport details are encrypted and never stored in local storage.
            </div>
          </div>

          {/* Summary */}
          <div className="card p-5 sticky top-24 h-fit">
            <h3 className="font-display font-semibold text-white mb-4">Flight Summary</h3>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Flight</span>
                <span className="text-white font-mono">{selectedFlight.flight_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route</span>
                <span className="text-white">{selectedFlight.origin} → {selectedFlight.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departure</span>
                <span className="text-white">{formatTime(selectedFlight.departs_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-white">{formatDate(selectedFlight.departs_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">{formatDuration(selectedFlight.departs_at, selectedFlight.arrives_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seat</span>
                <span className="text-white font-mono">{selectedSeat.seat_number} ({selectedSeat.class})</span>
              </div>
              <div className="border-t border-white/8 pt-3 flex justify-between">
                <span className="text-slate-300 font-medium">Total</span>
                <span className="text-xl font-bold font-display text-white">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Confirm Booking
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
