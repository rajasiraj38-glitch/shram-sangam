// src/app/api/jobs/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  // Only accept if still 'requested' and unassigned
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, status, worker_id')
    .eq('id', params.id)
    .single();

  if (fetchErr || !booking) return NextResponse.json(apiError('Booking not found', 'NOT_FOUND'), { status: 404 });
  if (booking.status !== 'requested') return NextResponse.json(apiError('Booking no longer available', 'INVALID_STATE'), { status: 422 });
  if (booking.worker_id) return NextResponse.json(apiError('Already assigned', 'CONFLICT'), { status: 409 });

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ worker_id: workerId, status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('status', 'requested')  // optimistic lock
    .is('worker_id', null)
    .select('*')
    .single();

  if (error || !updated) return NextResponse.json(apiError('Could not accept — booking taken', 'CONFLICT'), { status: 409 });
  return NextResponse.json(apiSuccess(updated, 'Job accepted!'));
}
