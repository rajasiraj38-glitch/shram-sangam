import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role') ?? 'worker_member';
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, coop_shares, guild_category')
    .eq('role', role)
    .limit(1)
    .single();

  if (error || !profile) {
    return NextResponse.json(apiError('No demo profile', 'NOT_FOUND'), { status: 404 });
  }

  const res = NextResponse.json(apiSuccess({ profile }));
  res.cookies.set('demo_user_id',   profile.id,        { path: '/', httpOnly: true, maxAge: 86400 });
  res.cookies.set('demo_user_role', profile.role,      { path: '/', maxAge: 86400 });
  res.cookies.set('demo_user_name', profile.full_name, { path: '/', maxAge: 86400 });
  return res;
}
