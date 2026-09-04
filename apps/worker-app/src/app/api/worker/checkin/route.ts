// src/app/api/worker/checkin/route.ts — Safety heartbeat
import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Forward to automation-engine Redis key via a simple HTTP call
const ENGINE_URL = process.env['AUTOMATION_ENGINE_URL'] ?? '';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = z.object({ booking_id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Invalid booking_id', 'VALIDATION_ERROR'), { status: 422 });

  // Best-effort forward to automation engine
  if (ENGINE_URL) {
    fetch(`${ENGINE_URL}/internal/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: parsed.data.booking_id }),
    }).catch(() => {/* non-fatal */});
  }

  return NextResponse.json(apiSuccess({ ok: true, checked_in_at: new Date().toISOString() }));
}
