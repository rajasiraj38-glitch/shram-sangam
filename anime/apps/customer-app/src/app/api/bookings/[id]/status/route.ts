// src/app/api/bookings/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateBookingStatusSchema, VALID_TRANSITIONS, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

function getSupabase() {
  return createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const userId      = (await cookieStore).get('demo_user_id')?.value;
  if (!userId) {
    return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });
  }

  const body   = await req.json();
  const parsed = UpdateBookingStatusSchema.safeParse({ ...body, booking_id: params.id });

  if (!parsed.success) {
    return NextResponse.json(apiError('Invalid request', 'VALIDATION_ERROR'), { status: 422 });
  }

  const supabase = getSupabase();

  // Fetch current booking
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('status, customer_id, worker_id, completion_otp')
    .eq('id', params.id)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json(apiError('Booking not found', 'NOT_FOUND'), { status: 404 });
  }

  // Validate state machine
  const allowed = VALID_TRANSITIONS[booking.status as keyof typeof VALID_TRANSITIONS] ?? [];
  if (!allowed.includes(parsed.data.new_status)) {
    return NextResponse.json(
      apiError(`Cannot transition from ${booking.status} to ${parsed.data.new_status}`, 'INVALID_TRANSITION'),
      { status: 422 },
    );
  }

  // OTP check for completing a job
  if (parsed.data.new_status === 'completed') {
    if (!parsed.data.completion_otp || parsed.data.completion_otp !== booking.completion_otp) {
      return NextResponse.json(apiError('Invalid OTP', 'INVALID_OTP'), { status: 422 });
    }
  }

  const updatePayload: Record<string, unknown> = {
    status:     parsed.data.new_status,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.new_status === 'completed') {
    updatePayload['completed_at'] = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', params.id)
    .select('*')
    .single();

  if (updateErr) {
    return NextResponse.json(apiError('Update failed', 'DB_ERROR'), { status: 500 });
  }

  return NextResponse.json(apiSuccess(updated));
}
