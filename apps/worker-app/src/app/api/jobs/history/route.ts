// src/app/api/jobs/history/route.ts — completed + cancelled jobs
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET() {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const { data, error } = await supabase
    .from('bookings')
    .select(`*, services ( title, category )`)
    .eq('worker_id', workerId)
    .in('status', ['completed', 'cancelled', 'disputed'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json(apiError('Failed to fetch history', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data ?? []));
}
