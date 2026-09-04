// services/automation-engine/src/quorum.ts
// Nightly quorum checker — evaluates expired proposals and enacts passed ones.
//
// When a proposal deadline passes:
//  1. Count total eligible voters (all active worker_members)
//  2. Apply evaluateQuorum() logic
//  3. Update proposal status to 'passed', 'rejected', or 'quorum_not_met'
//  4. If passed + category is 'Fee Adjustment' → auto-update platform config

import { query, db } from './db';

interface Proposal {
  id: string;
  title: string;
  category: string;
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  quorum_threshold: number;
  pass_threshold: number;
  proposed_platform_fee_percent: number | null;
}

function evaluateOutcome(
  p: Proposal,
  totalEligible: number,
): 'passed' | 'rejected' | 'quorum_not_met' {
  const totalCast = p.votes_yes + p.votes_no + p.votes_abstain;
  const quorumPct = totalEligible > 0 ? totalCast / totalEligible : 0;
  const quorumMet = quorumPct >= p.quorum_threshold;

  if (!quorumMet) return 'quorum_not_met';

  const yesPct = (p.votes_yes + p.votes_no) > 0
    ? p.votes_yes / (p.votes_yes + p.votes_no)
    : 0;

  return yesPct >= p.pass_threshold ? 'passed' : 'rejected';
}

async function enactFeeAdjustment(proposal: Proposal): Promise<void> {
  if (proposal.proposed_platform_fee_percent == null) return;

  const newFee = proposal.proposed_platform_fee_percent;
  // Store in a config table (or environment variable update)
  // For demo: we upsert into a simple platform_config key-value table
  await db.query(
    `INSERT INTO platform_config (key, value, updated_at)
     VALUES ('coop_platform_fee_percent', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [String(newFee)],
  ).catch(() => {
    // Table may not exist in all environments — log and continue
    console.warn('[quorum] platform_config table not found — fee not persisted');
  });

  console.log(`[quorum] Fee adjusted to ${newFee}% via proposal "${proposal.title}"`);
}

export async function runQuorumCycle(): Promise<void> {
  // Fetch proposals whose deadline has passed and are still 'active'
  const expired = await query<Proposal>(
    `SELECT id, title, category::text,
            votes_yes::int, votes_no::int, votes_abstain::int,
            quorum_threshold::float, pass_threshold::float,
            proposed_platform_fee_percent::float
     FROM proposals
     WHERE status = 'active'
       AND deadline < NOW()`,
    [],
    'quorum:fetch',
  );

  if (expired.length === 0) return;

  // Count total eligible voters once
  const [{ count: eligibleStr }] = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM profiles
     WHERE role = 'worker_member' AND is_verified = true`,
    [],
    'quorum:eligible',
  );
  const totalEligible = parseInt(eligibleStr, 10);

  console.log(`[quorum] Evaluating ${expired.length} expired proposal(s), ${totalEligible} eligible voters`);

  for (const proposal of expired) {
    const outcome = evaluateOutcome(proposal, totalEligible);

    await db.query(
      `UPDATE proposals
       SET status = $1,
           total_eligible_voters = $2,
           enacted_at = CASE WHEN $1 = 'passed' THEN NOW() ELSE NULL END
       WHERE id = $3`,
      [outcome, totalEligible, proposal.id],
    );

    console.log(`[quorum] Proposal "${proposal.title.slice(0, 40)}" → ${outcome}`);

    if (outcome === 'passed' && proposal.category === 'Fee Adjustment') {
      await enactFeeAdjustment(proposal);
    }
  }
}
