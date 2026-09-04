import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateProposalSchema, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET() {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json(apiError('Failed to fetch', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data ?? []));
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const userId      = (await cookieStore).get('demo_user_id')?.value;
  if (!userId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = CreateProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError('Invalid proposal', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>),
      { status: 422 },
    );
  }

  // Count total eligible voters at proposal time
  const { count: eligibleCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'worker_member')
    .eq('is_verified', true);

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      ...parsed.data,
      proposed_by:            userId,
      status:                 'active',
      votes_yes:              0,
      votes_no:               0,
      votes_abstain:          0,
      total_eligible_voters:  eligibleCount ?? 0,
      quorum_threshold:       parsed.data.quorum_threshold ?? 0.5,
      pass_threshold:         parsed.data.pass_threshold ?? 0.66,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Failed to create', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data), { status: 201 });
}
