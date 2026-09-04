// src/app/api/earnings/summary/route.ts
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
  const workerId    = (await cookieStore).get('demo_user_id')?.value;
  if (!workerId) return NextResponse.json(apiError('Not authenticated', 'AUTH_REQUIRED'), { status: 401 });

  const thisMonth = new Date().toISOString().slice(0, 7);

  // Monthly earnings from patronage ledger
  const [ledgerRes, profileRes, coopRes] = await Promise.all([
    supabase
      .from('patronage_ledger')
      .select('amount_earned, points_accrued')
      .eq('worker_id', workerId)
      .eq('month', thisMonth),
    supabase
      .from('profiles')
      .select('coop_shares')
      .eq('id', workerId)
      .single(),
    supabase
      .from('coop_financials')
      .select('operational_reserve, total_gigs_completed')
      .limit(1)
      .single(),
  ]);

  const ledger      = ledgerRes.data ?? [];
  const totalEarned = ledger.reduce((s, r) => s + Number(r.amount_earned), 0);
  const totalPoints = ledger.reduce((s, r) => s + Number(r.points_accrued), 0);
  const totalJobs   = ledger.length;
  const shares      = profileRes.data?.coop_shares ?? 1;

  // Estimated dividend: worker's share of 10% operational surplus
  // Simplified: (worker_shares / total_shares) × (operational_reserve × 0.1)
  const coopReserve = Number(coopRes.data?.operational_reserve ?? 0);
  const totalGigs   = Number(coopRes.data?.total_gigs_completed ?? 1);
  const estimatedDividend = totalJobs > 0
    ? parseFloat(((totalJobs / Math.max(totalGigs, 1)) * coopReserve * 0.1).toFixed(2))
    : 0;

  return NextResponse.json(apiSuccess({
    total_earned:       parseFloat(totalEarned.toFixed(2)),
    total_jobs:         totalJobs,
    total_points:       totalPoints,
    coop_shares:        shares,
    estimated_dividend: estimatedDividend,
    month:              thisMonth,
  }));
}
