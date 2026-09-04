import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@shram-sangam/shared-types';
import { cookies } from 'next/headers';
import { z } from 'zod';

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
);

const Body = z.object({
  verdict: z.enum(['full_refund_customer', 'full_payout_worker', 'partial_split', 'rebook_required']),
  worker_payout_percent: z.number().min(0).max(100).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const userId      = (await cookieStore).get('demo_user_id')?.value;
  if (!userId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json(apiError('Invalid verdict', 'VALIDATION_ERROR'), { status: 422 });

  const { data: dispute } = await supabase
    .from('disputes')
    .select('status, jury_member_ids')
    .eq('id', params.id)
    .single();

  if (!dispute) return NextResponse.json(apiError('Dispute not found', 'NOT_FOUND'), { status: 404 });
  if (!dispute.jury_member_ids?.includes(userId)) {
    return NextResponse.json(apiError('Not a jury member for this dispute', 'FORBIDDEN'), { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from('disputes')
    .update({
      verdict:               parsed.data.verdict,
      worker_payout_percent: parsed.data.worker_payout_percent,
      status:                'resolved',
      resolved_at:           new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json(apiError('Update failed', 'DB_ERROR'), { status: 500 });
  return NextResponse.json(apiSuccess(updated, 'Verdict recorded'));
}
