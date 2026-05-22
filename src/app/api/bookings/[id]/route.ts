import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('bookings')
    .select('*, flight:flights(*), seat:seats(*), passengers(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ booking: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, new_flight_id, new_seat_id } = body;

  if (action === 'cancel') {
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: params.id,
      p_user_id: user.id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data.success) return NextResponse.json({ error: data.error }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === 'reschedule') {
    if (!new_flight_id || !new_seat_id) {
      return NextResponse.json({ error: 'Missing new_flight_id or new_seat_id' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('reschedule_booking', {
      p_booking_id: params.id,
      p_user_id: user.id,
      p_new_flight_id: new_flight_id,
      p_new_seat_id: new_seat_id,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data.success) return NextResponse.json({ error: data.error }, { status: 400 });
    return NextResponse.json({ success: true, fee_charged: data.fee_charged });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
