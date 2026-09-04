import { z } from "zod";

// ─── Cooperative Financial Pool ───────────────────────────────────────────────

export const CoopFinancialsSchema = z.object({
  id: z.string().uuid(),
  operational_reserve: z.number().nonnegative(),  // Accumulated 7% pool
  mutual_aid_reserve: z.number().nonnegative(),   // Accumulated 3% pool
  total_disbursed_to_workers: z.number().nonnegative(),
  total_gigs_completed: z.number().int().nonnegative(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime().optional(),
  updated_at: z.string().datetime(),
});
export type CoopFinancials = z.infer<typeof CoopFinancialsSchema>;

// ─── Worker Patronage / Dividend ──────────────────────────────────────────────

export const PatronageLedgerSchema = z.object({
  id: z.string().uuid(),
  worker_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  amount_earned: z.number().positive(),    // Worker's 90% for this booking
  points_accrued: z.number().int(),        // 1 point per ₹10 earned
  month: z.string().regex(/^\d{4}-\d{2}$/), // "2024-11"
  created_at: z.string().datetime(),
});
export type PatronageLedger = z.infer<typeof PatronageLedgerSchema>;

export const WorkerDividendSummarySchema = z.object({
  worker_id: z.string().uuid(),
  month: z.string(),
  total_jobs: z.number().int(),
  total_earned: z.number(),
  total_points: z.number().int(),
  estimated_dividend: z.number(),          // Proportional share of operational surplus
  coop_shares: z.number().int(),
});
export type WorkerDividendSummary = z.infer<typeof WorkerDividendSummarySchema>;

// ─── Mutual Aid Claim ─────────────────────────────────────────────────────────

export const MutualAidClaimStatusSchema = z.enum([
  "pending_review",
  "peer_review",
  "approved",
  "rejected",
  "disbursed",
]);
export type MutualAidClaimStatus = z.infer<typeof MutualAidClaimStatusSchema>;

export const MutualAidClaimSchema = z.object({
  id: z.string().uuid(),
  worker_id: z.string().uuid(),
  claim_type: z.enum([
    "tool_replacement",
    "medical_emergency",
    "accident_on_site",
    "other",
  ]),
  amount_requested: z.number().positive().max(15000), // Max ₹15,000 per claim
  description: z.string().min(20).max(1000),
  receipt_url: z.string().url().optional(),
  status: MutualAidClaimStatusSchema,
  peer_approvals: z.array(z.string().uuid()).default([]), // Worker IDs who approved
  approved_amount: z.number().nonnegative().optional(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().optional(),
});
export type MutualAidClaim = z.infer<typeof MutualAidClaimSchema>;

export const CreateMutualAidClaimSchema = MutualAidClaimSchema.pick({
  claim_type: true,
  amount_requested: true,
  description: true,
  receipt_url: true,
});
export type CreateMutualAidClaimInput = z.infer<typeof CreateMutualAidClaimSchema>;

// ─── Payout Record ────────────────────────────────────────────────────────────

export const PayoutStatusSchema = z.enum([
  "queued",
  "processing",
  "success",
  "failed",
]);

export const PayoutRecordSchema = z.object({
  id: z.string().uuid(),
  worker_id: z.string().uuid(),
  booking_id: z.string().uuid().optional(),
  claim_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  payout_type: z.enum(["job_earnings", "dividend", "mutual_aid_grant"]),
  status: PayoutStatusSchema,
  gateway_reference: z.string().optional(), // Razorpay transfer ID
  created_at: z.string().datetime(),
  settled_at: z.string().datetime().optional(),
});
export type PayoutRecord = z.infer<typeof PayoutRecordSchema>;
