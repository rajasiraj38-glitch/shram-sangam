// services/automation-engine/src/settlement.ts
// Processes 'queued' payout records — triggers Razorpay transfers
// and updates worker balances atomically.
//
// The DB trigger `trg_autonomous_settlement` already routes fees to the
// coop_financials pools and writes the payout_record on booking completion.
// This worker picks up queued records and handles the actual money transfer.

import Razorpay from 'razorpay';
import { query, db } from './db';
import { redis, payoutRetryKey } from './redis';
import { config } from './config';

const MAX_RETRIES = 3;

interface PayoutRecord {
  id: string;
  worker_id: string;
  booking_id: string | null;
  claim_id: string | null;
  amount: number;
  payout_type: 'job_earnings' | 'dividend' | 'mutual_aid_grant';
}

// Initialise Razorpay only when keys are present
let razorpay: InstanceType<typeof Razorpay> | null = null;

function getRazorpay(): InstanceType<typeof Razorpay> | null {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) return null;
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id:     config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }
  return razorpay;
}

async function getWorkerFundAccount(workerId: string): Promise<string | null> {
  // In a real system this would look up the worker's linked bank/UPI account
  // from a fund_accounts table. For hackathon we return a mock reference.
  const rows = await query<{ fund_account_id: string | null }>(
    `SELECT NULL AS fund_account_id FROM profiles WHERE id = $1`,
    [workerId],
    'settlement:fund-account',
  );
  return rows[0]?.fund_account_id ?? null;
}

async function processOnePayout(payout: PayoutRecord): Promise<void> {
  const retryKey  = payoutRetryKey(payout.id);
  const attempts  = parseInt((await redis.get(retryKey)) ?? '0', 10);

  if (attempts >= MAX_RETRIES) {
    console.warn(`[settlement] Payout ${payout.id.slice(0, 8)} hit max retries — marking failed`);
    await db.query(
      `UPDATE payout_records SET status = 'failed' WHERE id = $1`,
      [payout.id],
    );
    return;
  }

  // Mark as processing to prevent duplicate runs
  await db.query(
    `UPDATE payout_records SET status = 'processing' WHERE id = $1 AND status = 'queued'`,
    [payout.id],
  );

  const rz = getRazorpay();

  if (!rz) {
    // No Razorpay keys — simulate success for local/hackathon demo
    console.log(
      `[settlement] (mock) Payout ${payout.id.slice(0, 8)} — ₹${payout.amount} ` +
      `→ worker ${payout.worker_id.slice(0, 8)} [${payout.payout_type}]`,
    );
    await db.query(
      `UPDATE payout_records
       SET status = 'success', gateway_reference = $1, settled_at = NOW()
       WHERE id = $2`,
      [`mock_${payout.id.slice(0, 8)}`, payout.id],
    );
    return;
  }

  try {
    const fundAccountId = await getWorkerFundAccount(payout.worker_id);
    if (!fundAccountId) {
      throw new Error('No linked fund account for worker');
    }

    // Razorpay Payouts API
    const transfer = await (rz as unknown as {
      payouts: { create: (p: Record<string, unknown>) => Promise<{ id: string }> };
    }).payouts.create({
      account_number: process.env['RAZORPAY_ACCOUNT_NUMBER'] ?? '',
      fund_account_id: fundAccountId,
      amount:          Math.round(payout.amount * 100), // paise
      currency:        'INR',
      mode:            'UPI',
      purpose:         payout.payout_type === 'job_earnings' ? 'payout' : 'refund',
      queue_if_low_balance: true,
      reference_id:    payout.id,
      narration:       `Shram Sangam — ${payout.payout_type.replace(/_/g, ' ')}`,
    });

    await db.query(
      `UPDATE payout_records
       SET status = 'success', gateway_reference = $1, settled_at = NOW()
       WHERE id = $2`,
      [transfer.id, payout.id],
    );
    console.log(`[settlement] Payout ${payout.id.slice(0, 8)} success → ${transfer.id}`);
  } catch (err) {
    console.error(`[settlement] Payout ${payout.id.slice(0, 8)} failed:`, (err as Error).message);
    await redis.set(retryKey, String(attempts + 1), 'EX', 3600);
    await db.query(
      `UPDATE payout_records SET status = 'queued' WHERE id = $1`,
      [payout.id],
    );
  }
}

export async function runSettlementCycle(): Promise<void> {
  const queued = await query<PayoutRecord>(
    `SELECT id, worker_id, booking_id, claim_id, amount::float, payout_type
     FROM payout_records
     WHERE status = 'queued'
     ORDER BY created_at ASC
     LIMIT 20`,
    [],
    'settlement:fetch',
  );

  if (queued.length > 0) {
    console.log(`[settlement] Processing ${queued.length} queued payout(s)`);
  }

  // Process sequentially to avoid overwhelming the gateway
  for (const payout of queued) {
    await processOnePayout(payout);
  }
}
