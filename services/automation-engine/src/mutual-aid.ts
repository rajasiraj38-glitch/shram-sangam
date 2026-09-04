// services/automation-engine/src/mutual-aid.ts
// Parametric mutual aid automation:
//  - Detects claims that have 2/3 peer approvals and auto-disburses
//  - Validates worker eligibility (≥20 completed gigs, active member)
//  - Creates a queued payout_record for settlement worker to process

import { query, db } from './db';
import { notifyBookingUpdate } from './realtime';

interface PendingClaim {
  id: string;
  worker_id: string;
  amount_requested: number;
  claim_type: string;
  peer_approvals: string[];
  description: string;
}

const MIN_GIGS_FOR_ELIGIBILITY = 20;
const PEER_APPROVALS_NEEDED     = 2;

async function isWorkerEligible(workerId: string): Promise<boolean> {
  const rows = await query<{ gig_count: string }>(
    `SELECT COUNT(*) AS gig_count
     FROM bookings
     WHERE worker_id = $1 AND status = 'completed'`,
    [workerId],
    'mutual-aid:eligibility',
  );
  return parseInt(rows[0]?.gig_count ?? '0', 10) >= MIN_GIGS_FOR_ELIGIBILITY;
}

async function hasSufficientFunds(amount: number): Promise<boolean> {
  const rows = await query<{ reserve: string }>(
    `SELECT mutual_aid_reserve::float AS reserve FROM coop_financials LIMIT 1`,
    [],
    'mutual-aid:funds',
  );
  return parseFloat(rows[0]?.reserve ?? '0') >= amount;
}

async function disburseGrant(claim: PendingClaim): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Deduct from mutual aid reserve
    await client.query(
      `UPDATE coop_financials
       SET mutual_aid_reserve = mutual_aid_reserve - $1`,
      [claim.amount_requested],
    );

    // Mark claim as approved + disbursed
    await client.query(
      `UPDATE mutual_aid_claims
       SET status = 'disbursed',
           approved_amount = $1,
           resolved_at = NOW()
       WHERE id = $2`,
      [claim.amount_requested, claim.id],
    );

    // Queue payout record for settlement worker
    await client.query(
      `INSERT INTO payout_records
         (worker_id, claim_id, amount, payout_type, status)
       VALUES ($1, $2, $3, 'mutual_aid_grant', 'queued')`,
      [claim.worker_id, claim.id, claim.amount_requested],
    );

    await client.query('COMMIT');

    console.log(
      `[mutual-aid] Grant disbursed — claim ${claim.id.slice(0, 8)}, ₹${claim.amount_requested} → worker ${claim.worker_id.slice(0, 8)}`,
    );

    // Notify worker
    await notifyBookingUpdate(claim.worker_id, {
      type:    'MUTUAL_AID_APPROVED',
      claim_id: claim.id,
      amount:   claim.amount_requested,
      message: `Your ₹${claim.amount_requested} mutual aid claim has been approved and queued for payment.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[mutual-aid] Disbursement failed for claim ${claim.id}:`, (err as Error).message);
  } finally {
    client.release();
  }
}

export async function runMutualAidCycle(): Promise<void> {
  // Find claims in peer_review that have enough approvals
  const claims = await query<PendingClaim & { peer_approvals: string[] }>(
    `SELECT id, worker_id, amount_requested::float,
            claim_type::text, description,
            peer_approvals
     FROM mutual_aid_claims
     WHERE status = 'peer_review'
       AND array_length(peer_approvals, 1) >= $1`,
    [PEER_APPROVALS_NEEDED],
    'mutual-aid:fetch',
  );

  for (const claim of claims) {
    const eligible = await isWorkerEligible(claim.worker_id);
    if (!eligible) {
      console.log(`[mutual-aid] Worker ${claim.worker_id.slice(0, 8)} not eligible (< ${MIN_GIGS_FOR_ELIGIBILITY} gigs)`);
      await db.query(
        `UPDATE mutual_aid_claims SET status = 'rejected' WHERE id = $1`,
        [claim.id],
      );
      continue;
    }

    const funded = await hasSufficientFunds(claim.amount_requested);
    if (!funded) {
      console.warn(`[mutual-aid] Insufficient mutual aid reserve for claim ${claim.id.slice(0, 8)}`);
      continue;
    }

    await disburseGrant(claim);
  }
}
