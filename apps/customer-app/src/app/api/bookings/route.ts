// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateBookingSchema, computeFeeBreakdown, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

function getSupabase() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );
}

// GET /api/bookings — list customer's bookings
export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const customerId  = (await cookieStore).get('demo_user_id')?.value;

  if (!customerId) {
    return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services ( title, category, icon_name ),
      worker:profiles!bookings_worker_id_fkey ( full_name, phone, guild_category )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(apiError('Failed to fetch bookings', 'DB_ERROR'), { status: 500 });
  }

  return NextResponse.json(apiSuccess(data));
}

// POST /api/bookings — create a new booking
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const customerId  = (await cookieStore).get('demo_user_id')?.value;

  if (!customerId) {
    return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      apiError('Invalid request', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>),
      { status: 422 },
    );
  }

  const { service_id, address, latitude, longitude, scheduled_at, notes, total_amount } = parsed.data;
  const fees = computeFeeBreakdown(total_amount);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id:             customerId,
      service_id,
      address,
      latitude,
      longitude,
      scheduled_at,
      notes,
      total_amount:            fees.total_amount,
      worker_payout:           fees.worker_payout,
      coop_reserve_fee:        fees.coop_reserve_fee,
      mutual_aid_contribution: fees.mutual_aid_contribution,
      status:                  'requested',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[api/bookings POST]', error);
    return NextResponse.json(apiError('Failed to create booking', 'DB_ERROR'), { status: 500 });
  }

  return NextResponse.json(apiSuccess(data, 'Booking created — finding the best worker nearby'), { status: 201 });
}
