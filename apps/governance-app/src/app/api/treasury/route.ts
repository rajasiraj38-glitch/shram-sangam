import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET() {
  const [finRes, memberRes, gigRes] = await Promise.all([
    supabase.from('coop_financials').select('*').limit(1).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'worker_member').eq('is_verified', true),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  if (finRes.error) return NextResponse.json(apiError('Failed to fetch treasury', 'DB_ERROR'), { status: 500 });

  return NextResponse.json(apiSuccess({
    ...finRes.data,
    total_verified_members: memberRes.count ?? 0,
    total_completed_gigs:   gigRes.count   ?? 0,
  }));
}
