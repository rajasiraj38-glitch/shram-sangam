// src/app/api/mutual-aid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateMutualAidClaimSchema, apiSuccess, apiError } from '@shram-sangam/shared-types';
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
    .from('mutual_aid_claims')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json(apiError('Failed to fetch claims', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data ?? []));
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = CreateMutualAidClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError('Invalid claim', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>),
      { status: 422 },
    );
  }

  // Check worker has ≥5 completed gigs (minimum for demo)
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('worker_id', workerId)
    .eq('status', 'completed');

  if ((count ?? 0) < 5) {
    return NextResponse.json(
      apiError('Need at least 5 completed gigs to file a mutual aid claim', 'INELIGIBLE'),
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from('mutual_aid_claims')
    .insert({ ...parsed.data, worker_id: workerId, status: 'pending_review' })
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Failed to create claim', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data, 'Claim submitted — peers will review within 48 hours'), { status: 201 });
}
