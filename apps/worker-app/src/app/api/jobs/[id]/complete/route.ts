// src/app/api/jobs/[id]/complete/route.ts — worker submits OTP to complete job
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = z.object({ otp: z.string().length(6) }).safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Invalid OTP format', 'VALIDATION_ERROR'), { status: 422 });

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, status, worker_id, completion_otp')
    .eq('id', params.id)
    .single();

  if (fetchErr || !booking) return NextResponse.json(apiError('Not found', 'NOT_FOUND'), { status: 404 });
  if (booking.worker_id !== workerId) return NextResponse.json(apiError('Forbidden', 'FORBIDDEN'), { status: 403 });
  if (booking.status !== 'in_progress') return NextResponse.json(apiError('Job not in progress', 'INVALID_STATE'), { status: 422 });
  if (booking.completion_otp !== parsed.data.otp) return NextResponse.json(apiError('Incorrect OTP', 'INVALID_OTP'), { status: 422 });

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Completion failed', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(updated, 'Job completed — payment processing'));
}
