'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatPrice } from '@/lib/utils';
import type { Seat, SeatClass } from '@/types';

interface SeatMapProps {
  flightId: string;
  selectedSeatId: string | null;
  optimisticSeatId: string | null;
  existingUserSeatId?: string | null;
  onSeatSelect: (seat: Seat) => void;
}

const CLASS_ORDER: SeatClass[] = ['first', 'business', 'economy'];

const CLASS_CONFIG = {
  first: {
    label: 'First Class',
    color: 'amber',
    rows: [1, 2],
    cols: ['A', 'C', 'D', 'F'],
    gap: true,
  },
  business: {
    label: 'Business',
    color: 'violet',
    rows: [3, 4, 5, 6, 7],
    cols: ['A', 'B', 'C', 'D', 'E', 'F'],
    gap: false,
  },
  economy: {
    label: 'Economy',
    color: 'sky',
    rows: Array.from({ length: 24 }, (_, i) => i + 8),
    cols: ['A', 'B', 'C', 'D', 'E', 'F'],
    gap: false,
  },
};

function Tooltip({ seat }: { seat: Seat }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="glass-strong rounded-lg px-2.5 py-2 text-xs whitespace-nowrap shadow-xl">
        <div className="font-semibold text-white">{seat.seat_number}</div>
        <div className="text-slate-400 capitalize">{seat.class}</div>
        {seat.extra_fee > 0 && (
          <div className="text-amber-400">+{formatPrice(seat.extra_fee)}</div>
        )}
        {!seat.is_available && (
          <div className="text-red-400">Occupied</div>
        )}
      </div>
      <div className="w-2 h-2 glass rotate-45 mx-auto -mt-1 border-b border-r border-white/8" />
    </div>
  );
}

export default function SeatMap({
  flightId,
  selectedSeatId,
  optimisticSeatId,
  existingUserSeatId,
  onSeatSelect,
}: SeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

  const fetchSeats = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number');
    if (!error && data) setSeats(data as Seat[]);
    setLoading(false);
  }, [flightId]);

  useEffect(() => {
    fetchSeats();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as Seat) : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, fetchSeats]);

  const getSeatByNumber = (seatNumber: string) =>
    seats.find((s) => s.seat_number === seatNumber);

  const getSeatStyle = (seat: Seat) => {
    if (seat.id === existingUserSeatId) return 'seat-yours';
    const isOptimistic = seat.id === optimisticSeatId || seat.id === selectedSeatId;
    if (isOptimistic) {
      if (seat.class === 'first') return 'seat-first-selected';
      if (seat.class === 'business') return 'seat-business-selected';
      return 'seat-selected';
    }
    if (!seat.is_available) return 'seat-occupied';
    if (seat.class === 'first') return 'seat-first-available';
    if (seat.class === 'business') return 'seat-business-available';
    return 'seat-available';
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 items-center py-12">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading seat map…</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 px-2">
        {[
          { label: 'Available', cls: 'bg-slate-700 border border-slate-600' },
          { label: 'Selected', cls: 'bg-sky-500 border border-sky-400' },
          { label: 'Occupied', cls: 'bg-slate-800/50 border border-slate-700/50 opacity-60' },
          { label: 'Your Seat', cls: 'bg-emerald-500 border border-emerald-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-slate-400">
            <div className={cn('w-5 h-5 rounded-md', item.cls)} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Plane nose */}
      <div className="flex justify-center mb-4">
        <div className="text-slate-600 text-xs uppercase tracking-widest font-semibold">✈ Front of Aircraft</div>
      </div>

      {/* Seat map by class */}
      <div className="flex flex-col gap-6 min-w-[320px]">
        {CLASS_ORDER.map((cls) => {
          const config = CLASS_CONFIG[cls];
          const classBadgeColor = {
            first: 'text-amber-400 bg-amber-500/10',
            business: 'text-violet-400 bg-violet-500/10',
            economy: 'text-sky-400 bg-sky-500/10',
          }[cls];

          return (
            <div key={cls}>
              {/* Class label */}
              <div className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3', classBadgeColor)}>
                {config.label}
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-1.5">
                {/* Column headers */}
                <div className="flex items-center gap-1 justify-center">
                  {config.cols.map((col, i) => (
                    <div key={col}>
                      {cls !== 'first' && i === 3 && <div className="w-4" />}
                      <div className="w-8 text-center text-xs text-slate-600 font-mono">{col}</div>
                    </div>
                  ))}
                </div>

                {config.rows.map((row) => (
                  <div key={row} className="flex items-center gap-1 justify-center">
                    <span className="text-xs text-slate-700 font-mono w-6 text-right mr-1">{row}</span>
                    {config.cols.map((col, i) => {
                      const seatNum = `${row}${col}`;
                      const seat = getSeatByNumber(seatNum);

                      return (
                        <div key={col} className="relative flex items-center">
                          {/* Aisle gap after C for economy/business, after C for first */}
                          {((cls !== 'first' && i === 3) || (cls === 'first' && i === 2)) && (
                            <div className="w-4" />
                          )}
                          {seat ? (
                            <div className="relative group/seat">
                              <button
                                disabled={!seat.is_available && seat.id !== existingUserSeatId}
                                onClick={() => seat.is_available && onSeatSelect(seat)}
                                onMouseEnter={() => setHoveredSeatId(seat.id)}
                                onMouseLeave={() => setHoveredSeatId(null)}
                                className={cn(
                                  'w-8 h-8 rounded-md text-xs font-mono transition-all duration-150 active:scale-90',
                                  getSeatStyle(seat)
                                )}
                                aria-label={`Seat ${seat.seat_number} ${seat.class} ${seat.is_available ? 'available' : 'occupied'}`}
                              >
                                {(seat.id === selectedSeatId || seat.id === optimisticSeatId) ? '✓' : ''}
                              </button>
                              {hoveredSeatId === seat.id && <Tooltip seat={seat} />}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-900/40 border border-slate-800/30" />
                          )}
                        </div>
                      );
                    })}
                    <span className="text-xs text-slate-700 font-mono w-6 ml-1">{row}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plane tail */}
      <div className="flex justify-center mt-6">
        <div className="text-slate-600 text-xs uppercase tracking-widest font-semibold">Rear of Aircraft</div>
      </div>
    </div>
  );
}
