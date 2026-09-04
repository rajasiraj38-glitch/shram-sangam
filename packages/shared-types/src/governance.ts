import { z } from "zod";

// ─── Proposals ────────────────────────────────────────────────────────────────

export const ProposalCategorySchema = z.enum([
  "Fee Adjustment",
  "Fund Allocation",
  "Policy Change",
  "Platform Feature",
  "Guild Rule",
  "Emergency Motion",
]);
export type ProposalCategory = z.infer<typeof ProposalCategorySchema>;

export const ProposalStatusSchema = z.enum([
  "draft",
  "active",
  "quorum_not_met",
  "passed",
  "rejected",
  "enacted",
]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ProposalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  category: ProposalCategorySchema,
  status: ProposalStatusSchema,
  proposed_by: z.string().uuid(),          // worker_member who submitted
  proposed_platform_fee_percent: z.number().min(0).max(30).optional(),

  // Quorum & voting config
  quorum_threshold: z.number().min(0).max(1).default(0.5),  // 50% of members
  pass_threshold: z.number().min(0).max(1).default(0.66),   // 66% of voters

  deadline: z.string().datetime(),
  enacted_at: z.string().datetime().optional(),

  // Tally snapshot (updated by automation engine)
  votes_yes: z.number().int().nonnegative().default(0),
  votes_no: z.number().int().nonnegative().default(0),
  votes_abstain: z.number().int().nonnegative().default(0),
  total_eligible_voters: z.number().int().nonnegative().default(0),

  created_at: z.string().datetime(),
});
export type Proposal = z.infer<typeof ProposalSchema>;

export const CreateProposalSchema = ProposalSchema.pick({
  title: true,
  description: true,
  category: true,
  proposed_platform_fee_percent: true,
  deadline: true,
}).extend({
  quorum_threshold: z.number().min(0).max(1).optional(),
  pass_threshold: z.number().min(0).max(1).optional(),
});
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;

// ─── Votes ────────────────────────────────────────────────────────────────────

export const VoteDecisionSchema = z.enum(["yes", "no", "abstain"]);
export type VoteDecision = z.infer<typeof VoteDecisionSchema>;

export const VoteSchema = z.object({
  id: z.string().uuid(),
  proposal_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  decision: VoteDecisionSchema,
  cast_at: z.string().datetime(),
});
export type Vote = z.infer<typeof VoteSchema>;

export const CastVoteSchema = z.object({
  proposal_id: z.string().uuid(),
  decision: VoteDecisionSchema,
});
export type CastVoteInput = z.infer<typeof CastVoteSchema>;

// ─── Quorum Evaluation (used by automation engine) ────────────────────────────

export interface QuorumResult {
  proposal_id: string;
  total_eligible: number;
  total_cast: number;
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  quorum_met: boolean;
  quorum_percent: number;
  pass_percent: number;
  outcome: "passed" | "rejected" | "quorum_not_met";
}

export function evaluateQuorum(
  proposal: Pick<
    Proposal,
    | "id"
    | "votes_yes"
    | "votes_no"
    | "votes_abstain"
    | "total_eligible_voters"
    | "quorum_threshold"
    | "pass_threshold"
  >
): QuorumResult {
  const totalCast =
    proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
  const quorumPercent =
    proposal.total_eligible_voters > 0
      ? totalCast / proposal.total_eligible_voters
      : 0;
  const passPercent =
    totalCast > 0 ? proposal.votes_yes / (proposal.votes_yes + proposal.votes_no) : 0;
  const quorumMet = quorumPercent >= proposal.quorum_threshold;

  let outcome: "passed" | "rejected" | "quorum_not_met";
  if (!quorumMet) {
    outcome = "quorum_not_met";
  } else if (passPercent >= proposal.pass_threshold) {
    outcome = "passed";
  } else {
    outcome = "rejected";
  }

  return {
    proposal_id: proposal.id,
    total_eligible: proposal.total_eligible_voters,
    total_cast: totalCast,
    votes_yes: proposal.votes_yes,
    votes_no: proposal.votes_no,
    votes_abstain: proposal.votes_abstain,
    quorum_met: quorumMet,
    quorum_percent: parseFloat((quorumPercent * 100).toFixed(1)),
    pass_percent: parseFloat((passPercent * 100).toFixed(1)),
    outcome,
  };
}

// ─── Dispute & Peer Arbitration ───────────────────────────────────────────────

export const DisputeStatusSchema = z.enum([
  "filed",
  "jury_assembled",
  "evidence_submitted",
  "deliberating",
  "resolved",
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const DisputeVerdictSchema = z.enum([
  "full_refund_customer",
  "full_payout_worker",
  "partial_split",
  "rebook_required",
]);

export const DisputeSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  filed_by: z.string().uuid(),        // customer or worker ID
  reason: z.string().min(20),
  evidence_urls: z.array(z.string().url()).default([]),
  status: DisputeStatusSchema,
  jury_member_ids: z.array(z.string().uuid()).default([]), // 3 randomly selected workers
  verdict: DisputeVerdictSchema.optional(),
  worker_payout_percent: z.number().min(0).max(100).optional(), // Used for partial_split
  resolution_notes: z.string().optional(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().optional(),
});
export type Dispute = z.infer<typeof DisputeSchema>;
