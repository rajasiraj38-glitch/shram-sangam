// src/app/api/jobs/[id]/status/route.ts — worker updates job status
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VALID_TRANSITIONS, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

const Body = z.object({ new_status: z.string() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(apiError('Invalid', 'VALIDATION_ERROR'), { status: 422 });

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, status, worker_id')
    .eq('id', params.id)
    .single();

  if (fetchErr || !booking) return NextResponse.json(apiError('Not found', 'NOT_FOUND'), { status: 404 });
  if (booking.worker_id !== workerId) return NextResponse.json(apiError('Forbidden', 'FORBIDDEN'), { status: 403 });

  const allowed = VALID_TRANSITIONS[booking.status as keyof typeof VALID_TRANSITIONS] ?? [];
  if (!allowed.includes(parsed.data.new_status as never)) {
    return NextResponse.json(apiError(`Cannot transition ${booking.status} → ${parsed.data.new_status}`, 'INVALID_TRANSITION'), { status: 422 });
  }

  // Generate OTP when moving arrived → in_progress
  const otpPatch = parsed.data.new_status === 'in_progress'
    ? { completion_otp: String(Math.floor(100000 + Math.random() * 900000)) }
    : {};

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: parsed.data.new_status, ...otpPatch, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Update failed', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(updated));
}
