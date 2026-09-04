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
  const userId      = (await cookieStore).get('demo_user_id')?.value;
  if (!userId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  // Jury members can see disputes they're assigned to; admins see all
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  let query = supabase
    .from('disputes')
    .select(`*, bookings ( total_amount, worker_payout, address, services ( title ) )`)
    .order('created_at', { ascending: false });

  if (profile?.role !== 'admin_coop') {
    query = query.contains('jury_member_ids', [userId]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json(apiError('Failed to fetch disputes', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data ?? []));
}
