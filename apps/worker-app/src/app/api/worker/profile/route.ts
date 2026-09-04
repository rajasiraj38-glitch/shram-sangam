// src/app/api/worker/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
    .from('profiles')
    .select('id, full_name, role, coop_shares, guild_category, is_available, is_verified, phone')
    .eq('id', workerId)
    .single();

  if (error || !data) return NextResponse.json(apiError('Profile not found', 'NOT_FOUND'), { status: 404 });
  return NextResponse.json(apiSuccess(data));
}
