-- Migration: 003_seed_data.sql
-- Seed flights, seats, and test user

-- =====================
-- SEED FLIGHTS (8 flights across 4 routes)
-- =====================
INSERT INTO public.flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES
  -- Route 1: BOM → DEL
  ('11111111-0000-0000-0000-000000000001', 'SA101', 'BOM', 'DEL',
   NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours 15 minutes',
   'Airbus A320', 'scheduled', 4500),
  ('11111111-0000-0000-0000-000000000002', 'SA102', 'BOM', 'DEL',
   NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 2 hours 10 minutes',
   'Boeing 737', 'scheduled', 5200),

  -- Route 2: DEL → BLR
  ('11111111-0000-0000-0000-000000000003', 'SA201', 'DEL', 'BLR',
   NOW() + INTERVAL '2 days 5 hours', NOW() + INTERVAL '2 days 7 hours 45 minutes',
   'Airbus A321', 'scheduled', 5800),
  ('11111111-0000-0000-0000-000000000004', 'SA202', 'DEL', 'BLR',
   NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 2 hours 45 minutes',
   'Boeing 737', 'scheduled', 4900),

  -- Route 3: BLR → HYD
  ('11111111-0000-0000-0000-000000000005', 'SA301', 'BLR', 'HYD',
   NOW() + INTERVAL '1 day 8 hours', NOW() + INTERVAL '1 day 9 hours 15 minutes',
   'ATR 72', 'scheduled', 2800),
  ('11111111-0000-0000-0000-000000000006', 'SA302', 'BLR', 'HYD',
   NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 1 hour 15 minutes',
   'Airbus A320', 'scheduled', 3100),

  -- Route 4: MAA → CCU
  ('11111111-0000-0000-0000-000000000007', 'SA401', 'MAA', 'CCU',
   NOW() + INTERVAL '3 days 6 hours', NOW() + INTERVAL '3 days 8 hours 30 minutes',
   'Boeing 737', 'scheduled', 6200),
  ('11111111-0000-0000-0000-000000000008', 'SA402', 'MAA', 'CCU',
   NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days 2 hours 30 minutes',
   'Airbus A320', 'scheduled', 5500)
ON CONFLICT (flight_no) DO NOTHING;

-- =====================
-- SEED SEATS for each flight
-- First class: rows 1-2, cols A,C,D,F (8 seats)
-- Business: rows 3-7, cols A-F (30 seats)  
-- Economy: rows 8-31, cols A-F (144 seats)
-- Total: 182 seats per flight
-- =====================
DO $$
DECLARE
  flight_record RECORD;
  row_num INT;
  col CHAR;
  seat_class VARCHAR(10);
  extra_fee DECIMAL;
BEGIN
  FOR flight_record IN SELECT id FROM public.flights LOOP

    -- First class seats (rows 1-2)
    FOR row_num IN 1..2 LOOP
      FOREACH col IN ARRAY ARRAY['A','C','D','F'] LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (
          flight_record.id,
          row_num || col,
          'first',
          CASE WHEN random() < 0.3 THEN false ELSE true END,
          8000
        )
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;

    -- Business seats (rows 3-7)
    FOR row_num IN 3..7 LOOP
      FOREACH col IN ARRAY ARRAY['A','B','C','D','E','F'] LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (
          flight_record.id,
          row_num || col,
          'business',
          CASE WHEN random() < 0.4 THEN false ELSE true END,
          3500
        )
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;

    -- Economy seats (rows 8-31)
    FOR row_num IN 8..31 LOOP
      FOREACH col IN ARRAY ARRAY['A','B','C','D','E','F'] LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (
          flight_record.id,
          row_num || col,
          'economy',
          CASE WHEN random() < 0.45 THEN false ELSE true END,
          0
        )
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;

  END LOOP;
END;
$$;
