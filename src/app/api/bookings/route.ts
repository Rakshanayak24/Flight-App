import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generatePNR } from '@/lib/utils';

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      flight:flights(*),
      seat:seats(*),
      passengers(*)
    `)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: bookings || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { flight_id, seat_id, total_price, passenger } = body;

  if (!flight_id || !seat_id || !total_price || !passenger) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const pnr_code = generatePNR();

  // Call the RPC to atomically reserve the seat
  const { data, error } = await supabase.rpc('reserve_seat', {
    p_seat_id: seat_id,
    p_flight_id: flight_id,
    p_user_id: user.id,
    p_total_price: total_price,
    p_pnr_code: pnr_code,
    p_full_name: passenger.full_name,
    p_passport_no: passenger.passport_no,
    p_nationality: passenger.nationality,
    p_dob: passenger.dob,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data.success) {
    return NextResponse.json({ error: data.error }, { status: 409 });
  }

  return NextResponse.json({
    success: true,
    booking_id: data.booking_id,
    pnr_code: data.pnr_code,
  });
}
