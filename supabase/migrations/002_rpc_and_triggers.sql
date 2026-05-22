-- Migration: 002_rpc_and_triggers.sql
-- RPC functions for concurrency-safe seat reservation and cancellation

-- =====================
-- SEAT RESERVATION RPC
-- Prevents double-booking using FOR UPDATE SKIP LOCKED
-- =====================
CREATE OR REPLACE FUNCTION public.reserve_seat(
  p_seat_id UUID,
  p_flight_id UUID,
  p_user_id UUID,
  p_total_price DECIMAL,
  p_pnr_code VARCHAR,
  p_full_name VARCHAR,
  p_passport_no VARCHAR,
  p_nationality VARCHAR,
  p_dob DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat RECORD;
  v_booking_id UUID;
  v_result JSON;
BEGIN
  -- Lock the seat row for update - prevents race conditions
  SELECT id, flight_id, is_available, class, extra_fee
  INTO v_seat
  FROM public.seats
  WHERE id = p_seat_id
    AND flight_id = p_flight_id
  FOR UPDATE;

  -- Check if seat exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Seat not found');
  END IF;

  -- Check availability
  IF NOT v_seat.is_available THEN
    RETURN json_build_object('success', false, 'error', 'Seat is no longer available');
  END IF;

  -- Create the booking
  INSERT INTO public.bookings (user_id, flight_id, seat_id, total_price, pnr_code, status)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code, 'confirmed')
  RETURNING id INTO v_booking_id;

  -- Create passenger record
  INSERT INTO public.passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

  -- Mark seat as unavailable
  UPDATE public.seats
  SET is_available = false
  WHERE id = p_seat_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'pnr_code', p_pnr_code
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================
-- CANCEL BOOKING RPC
-- Atomically cancels booking and frees seat
-- =====================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_flight RECORD;
BEGIN
  -- Get booking with flight info
  SELECT b.id, b.user_id, b.seat_id, b.flight_id, b.status, f.departs_at
  INTO v_booking
  FROM public.bookings b
  JOIN public.flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id
  FOR UPDATE;

  -- Check booking exists and belongs to user
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.user_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Booking already cancelled');
  END IF;

  -- DB-level 2-hour rule enforcement
  IF v_booking.departs_at - NOW() < INTERVAL '2 hours' AND v_booking.departs_at > NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cancellation not allowed within 2 hours of departure'
    );
  END IF;

  -- Update booking status
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Free the seat atomically
  UPDATE public.seats
  SET is_available = true
  WHERE id = v_booking.seat_id;

  RETURN json_build_object('success', true, 'message', 'Booking cancelled successfully');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================
-- RESCHEDULE BOOKING RPC
-- =====================
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id UUID,
  p_user_id UUID,
  p_new_flight_id UUID,
  p_new_seat_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_old_flight RECORD;
  v_new_flight RECORD;
  v_new_seat RECORD;
  v_fee DECIMAL := 0;
BEGIN
  -- Lock booking
  SELECT b.id, b.user_id, b.flight_id, b.seat_id, b.status, b.total_price
  INTO v_booking
  FROM public.bookings b
  WHERE b.id = p_booking_id AND b.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule a cancelled booking');
  END IF;

  -- Get old flight
  SELECT * INTO v_old_flight FROM public.flights WHERE id = v_booking.flight_id;
  -- Get new flight
  SELECT * INTO v_new_flight FROM public.flights WHERE id = p_new_flight_id;
  -- Lock new seat
  SELECT * INTO v_new_seat FROM public.seats WHERE id = p_new_seat_id FOR UPDATE;

  IF NOT v_new_seat.is_available THEN
    RETURN json_build_object('success', false, 'error', 'New seat is not available');
  END IF;

  -- Calculate fee if new flight is more expensive
  IF v_new_flight.base_price > v_old_flight.base_price THEN
    v_fee := v_new_flight.base_price - v_old_flight.base_price;
  END IF;

  -- Record reschedule
  INSERT INTO public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_booking.flight_id, p_new_flight_id, v_fee);

  -- Free old seat
  UPDATE public.seats SET is_available = true WHERE id = v_booking.seat_id;

  -- Update booking
  UPDATE public.bookings
  SET flight_id = p_new_flight_id,
      seat_id = p_new_seat_id,
      status = 'rescheduled',
      total_price = v_booking.total_price + v_fee
  WHERE id = p_booking_id;

  -- Reserve new seat
  UPDATE public.seats SET is_available = false WHERE id = p_new_seat_id;

  RETURN json_build_object(
    'success', true,
    'fee_charged', v_fee,
    'message', 'Booking rescheduled successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- =====================
-- DB-LEVEL TRIGGER: Block cancellation within 2hrs
-- =====================
CREATE OR REPLACE FUNCTION public.check_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT departs_at INTO v_departs_at
    FROM public.flights
    WHERE id = NEW.flight_id;

    IF v_departs_at - NOW() < INTERVAL '2 hours' AND v_departs_at > NOW() THEN
      RAISE EXCEPTION 'Cancellation not allowed within 2 hours of departure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_cancellation_window
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_cancellation_window();
