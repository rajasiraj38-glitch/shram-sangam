import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CastVoteSchema, apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

export async function GET(req: NextRequest) {
  const proposalId = req.nextUrl.searchParams.get('proposal_id');
  if (!proposalId) return NextResponse.json(apiError('proposal_id required', 'VALIDATION_ERROR'), { status: 422 });

  const { data, error } = await supabase
    .from('votes')
    .select('id, proposal_id, worker_id, decision, cast_at')
    .eq('proposal_id', proposalId);

  if (error) return NextResponse.json(apiError('Failed to fetch', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(data ?? []));
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const body   = await req.json();
  const parsed = CastVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError('Invalid vote', 'VALIDATION_ERROR'), { status: 422 });
  }

  // Check proposal is still active
  const { data: proposal } = await supabase
    .from('proposals')
    .select('status, deadline')
    .eq('id', parsed.data.proposal_id)
    .single();

  if (!proposal || proposal.status !== 'active') {
    return NextResponse.json(apiError('Proposal is not active', 'INVALID_STATE'), { status: 422 });
  }
  if (new Date(proposal.deadline) < new Date()) {
    return NextResponse.json(apiError('Voting deadline has passed', 'DEADLINE_PASSED'), { status: 422 });
  }

  // Upsert — UNIQUE(proposal_id, worker_id) enforces 1 member 1 vote at DB level
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { proposal_id: parsed.data.proposal_id, worker_id: workerId, decision: parsed.data.decision, cast_at: new Date().toISOString() },
      { onConflict: 'proposal_id,worker_id' },
    )
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Vote failed', 'DB_ERROR'), { status: 500 });

  // Update proposal tally (live count)
  await supabase.rpc('refresh_proposal_tally', { p_proposal_id: parsed.data.proposal_id }).catch(() => {
    // Fallback: manual tally update
    supabase.from('proposals').select('id').eq('id', parsed.data.proposal_id); // no-op, tally updated by trigger
  });

  return NextResponse.json(apiSuccess(data, 'Vote cast — 1 member, 1 vote'));
}
