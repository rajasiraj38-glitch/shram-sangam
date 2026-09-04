// src/app/api/demo-login/route.ts
// Hackathon demo login — picks a seeded profile by role and sets a cookie.
// Replace with real Supabase Auth in production.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get('role') ?? 'customer';

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, coop_shares')
    .eq('role', role)
    .limit(1)
    .single();

  if (error || !profile) {
    return NextResponse.json(apiError('No demo profile found', 'NOT_FOUND'), { status: 404 });
  }

  const response = NextResponse.json(apiSuccess({ profile }));
  response.cookies.set('demo_user_id',   profile.id,        { path: '/', httpOnly: true, maxAge: 86400 });
  response.cookies.set('demo_user_role', profile.role,      { path: '/', maxAge: 86400 });
  response.cookies.set('demo_user_name', profile.full_name, { path: '/', maxAge: 86400 });

  return response;
}
