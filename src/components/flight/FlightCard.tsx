'use client';

import { Plane, Clock, ArrowRight, Wifi } from 'lucide-react';
import { cn, formatTime, formatDate, formatDuration, formatPrice } from '@/lib/utils';
import type { Flight, SeatClass } from '@/types';

interface FlightCardProps {
  flight: Flight;
  selectedClass: SeatClass;
  onSelect: (flight: Flight) => void;
  availableSeats?: number;
}

const CLASS_PRICE_MULTIPLIER: Record<SeatClass, number> = {
  economy: 1,
  business: 2.5,
  first: 4.5,
};

const CLASS_EXTRA: Record<SeatClass, number> = {
  economy: 0,
  business: 3500,
  first: 8000,
};

export default function FlightCard({ flight, selectedClass, onSelect, availableSeats }: FlightCardProps) {
  const duration = formatDuration(flight.departs_at, flight.arrives_at);
  const totalPrice = flight.base_price * CLASS_PRICE_MULTIPLIER[selectedClass] + CLASS_EXTRA[selectedClass];

  const classColors: Record<SeatClass, string> = {
    economy: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    business: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    first: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  const classLabel: Record<SeatClass, string> = {
    economy: 'Economy',
    business: 'Business',
    first: 'First Class',
  };

  return (
    <div
      onClick={() => onSelect(flight)}
      className="card-hover p-5 group animate-fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Flight info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Airline logo placeholder */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs text-slate-500 font-mono">{flight.flight_no}</span>
              <span className="text-slate-700 text-xs mx-1">·</span>
              <span className="text-xs text-slate-500">{flight.aircraft_type}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-xl font-bold font-display">{formatTime(flight.departs_at)}</div>
                <div className="text-xs text-slate-400 font-semibold">{flight.origin}</div>
              </div>

              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {duration}
                </div>
                <div className="relative w-full flex items-center">
                  <div className="h-px bg-slate-700 flex-1" />
                  <Plane className="w-3 h-3 text-sky-500 mx-1 rotate-0" />
                  <div className="h-px bg-slate-700 flex-1" />
                </div>
                <div className="text-xs text-slate-600">{formatDate(flight.departs_at)}</div>
              </div>

              <div className="text-center">
                <div className="text-xl font-bold font-display">{formatTime(flight.arrives_at)}</div>
                <div className="text-xs text-slate-400 font-semibold">{flight.destination}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Price + class + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[140px]">
          <div className="text-right">
            <div className="text-2xl font-bold font-display text-white">
              {formatPrice(totalPrice)}
            </div>
            <div className="text-xs text-slate-500">per person</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={cn('badge border text-xs', classColors[selectedClass])}>
              {classLabel[selectedClass]}
            </span>
            {availableSeats !== undefined && (
              <span className={cn(
                'text-xs',
                availableSeats < 5 ? 'text-amber-400' : 'text-slate-500'
              )}>
                {availableSeats < 5 ? `Only ${availableSeats} left!` : `${availableSeats} seats`}
              </span>
            )}
          </div>

          <button className="btn-primary py-2 px-4 text-sm group-hover:bg-sky-400 flex items-center gap-1.5">
            Select <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
