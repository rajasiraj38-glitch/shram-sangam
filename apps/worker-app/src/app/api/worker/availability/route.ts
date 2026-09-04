// src/app/api/worker/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = z.object({ is_available: z.boolean() }).safeParse(body);
  if (!parsed.success) return NextResponse.json(apiError('Invalid', 'VALIDATION_ERROR'), { status: 422 });

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_available: parsed.data.is_available, updated_at: new Date().toISOString() })
    .eq('id', workerId)
    .select('is_available')
    .single();

  if (error) return NextResponse.json(apiError('Update failed', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data));
}
