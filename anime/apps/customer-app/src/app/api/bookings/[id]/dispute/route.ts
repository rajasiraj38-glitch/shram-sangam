// src/app/api/bookings/[id]/dispute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

const DisputeBody = z.object({
  reason: z.string().min(20, 'Please provide at least 20 characters describing the issue'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const userId      = (await cookieStore).get('demo_user_id')?.value;
  if (!userId) {
    return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });
  }

  const body   = await req.json();
  const parsed = DisputeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0]?.message ?? 'Invalid', 'VALIDATION_ERROR'), { status: 422 });
  }

  // Transition booking to 'disputed'
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('status, customer_id')
    .eq('id', params.id)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json(apiError('Booking not found', 'NOT_FOUND'), { status: 404 });
  }
  if (booking.customer_id !== userId) {
    return NextResponse.json(apiError('Access denied', 'FORBIDDEN'), { status: 403 });
  }
  if (!['in_progress', 'completed'].includes(booking.status)) {
    return NextResponse.json(apiError('Can only dispute in-progress or completed bookings', 'INVALID_STATE'), { status: 422 });
  }

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: 'disputed', dispute_reason: parsed.data.reason })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(apiError('Failed to file dispute', 'DB_ERROR'), { status: 500 });
  }

  // Create a dispute record
  await supabase.from('disputes').insert({
    booking_id: params.id,
    filed_by:   userId,
    reason:     parsed.data.reason,
    status:     'filed',
  });

  return NextResponse.json(apiSuccess(updated, 'Dispute filed — a peer jury will review within 24 hours'));
}
