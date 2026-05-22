-- Migration: 001_initial_schema.sql
-- Flight Management App - Complete Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- FLIGHTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_no VARCHAR(10) NOT NULL UNIQUE,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL DEFAULT 'Airbus A320',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed')),
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SEATS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  seat_number VARCHAR(4) NOT NULL,
  class VARCHAR(10) NOT NULL CHECK (class IN ('economy', 'business', 'first')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  extra_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_id, seat_number)
);

-- =====================
-- BOOKINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id),
  seat_id UUID NOT NULL REFERENCES public.seats(id),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'rescheduled', 'cancelled', 'pending')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  pnr_code VARCHAR(6) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PASSENGERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  passport_no VARCHAR(20) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RESCHEDULES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.reschedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES public.flights(id),
  new_flight_id UUID NOT NULL REFERENCES public.flights(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fee_charged DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedules ENABLE ROW LEVEL SECURITY;

-- Flights: anyone can read
CREATE POLICY "Flights are viewable by everyone"
  ON public.flights FOR SELECT
  USING (true);

-- Seats: anyone can read
CREATE POLICY "Seats are viewable by everyone"
  ON public.seats FOR SELECT
  USING (true);

-- Bookings: users can only see their own
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Passengers: users can see passengers for their bookings
CREATE POLICY "Users can view own passengers"
  ON public.passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = passengers.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own passengers"
  ON public.passengers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = passengers.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- Reschedules: users can view and insert their own
CREATE POLICY "Users can view own reschedules"
  ON public.reschedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reschedules.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reschedules"
  ON public.reschedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reschedules.booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_flights_origin_dest ON public.flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flights_departs_at ON public.flights(departs_at);
CREATE INDEX IF NOT EXISTS idx_seats_flight_id ON public.seats(flight_id);
CREATE INDEX IF NOT EXISTS idx_seats_available ON public.seats(flight_id, is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON public.bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_passengers_booking_id ON public.passengers(booking_id);

-- =====================
-- ENABLE REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
