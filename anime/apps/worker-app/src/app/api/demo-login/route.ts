// src/app/api/demo-login/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET() {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, coop_shares, guild_category, is_available, is_verified')
    .eq('role', 'worker_member')
    .eq('is_verified', true)
    .limit(1)
    .single();

  if (error || !profile) {
    return NextResponse.json(apiError('No demo worker found', 'NOT_FOUND'), { status: 404 });
  }

  const res = NextResponse.json(apiSuccess({ profile }));
  res.cookies.set('demo_user_id',   profile.id,        { path: '/', httpOnly: true, maxAge: 86400 });
  res.cookies.set('demo_user_role', profile.role,      { path: '/', maxAge: 86400 });
  res.cookies.set('demo_user_name', profile.full_name, { path: '/', maxAge: 86400 });
  return res;
}
