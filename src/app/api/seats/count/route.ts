import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const flightId = searchParams.get('flightId');
  const seatClass = searchParams.get('class');

  if (!flightId) {
    return NextResponse.json({ error: 'Missing flightId' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('seats')
    .select('id', { count: 'exact', head: true })
    .eq('flight_id', flightId)
    .eq('is_available', true);

  if (seatClass) {
    query = query.eq('class', seatClass);
  }

  const { count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}
