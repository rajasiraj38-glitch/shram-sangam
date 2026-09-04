// src/app/api/worker/sos/route.ts — Emergency SOS broadcast
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOSPayloadSchema, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = SOSPayloadSchema.safeParse({
    ...body,
    worker_id: workerId,
    timestamp: new Date().toISOString(),
  });

  if (!parsed.success) return NextResponse.json(apiError('Invalid SOS payload', 'VALIDATION_ERROR'), { status: 422 });

  // Broadcast to safety channel via Supabase Realtime
  try {
    await supabase.channel('safety:alerts').send({
      type:    'broadcast',
      event:   'SAFETY_SOS',
      payload: { ...parsed.data, type: 'SAFETY_SOS' },
    });
  } catch {/* non-fatal */}

  console.warn('[SOS]', JSON.stringify(parsed.data));
  return NextResponse.json(apiSuccess({ ok: true, received_at: new Date().toISOString() }));
}
