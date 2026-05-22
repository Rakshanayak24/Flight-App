import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin.toUpperCase())
    .eq('destination', destination.toUpperCase())
    .gte('departs_at', startOfDay)
    .lte('departs_at', endOfDay)
    .neq('status', 'cancelled')
    .order('departs_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flights: flights || [] });
}
