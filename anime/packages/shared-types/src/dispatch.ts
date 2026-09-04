import { z } from "zod";

// ─── Dispatch Candidate Scoring ───────────────────────────────────────────────
// Equity-weighted formula:
//   score = (1 / distance_km) × (1 + (target_gigs - completed_gigs) / target_gigs)
// Higher score = preferred for dispatch

export const DispatchCandidateSchema = z.object({
  worker_id: z.string().uuid(),
  distance_km: z.number().nonnegative(),
  gigs_completed_this_period: z.number().int().nonnegative(),
  target_gigs_per_period: z.number().int().positive().default(20),
  is_available: z.boolean(),
  is_verified: z.boolean(),
  guild_category: z.string(),
  equity_score: z.number(),  // computed
});
export type DispatchCandidate = z.infer<typeof DispatchCandidateSchema>;

export function computeEquityScore(
  distance_km: number,
  gigs_completed: number,
  target_gigs: number
): number {
  if (distance_km === 0) distance_km = 0.01; // prevent division by zero
  const equity_bonus = 1 + Math.max(0, (target_gigs - gigs_completed) / target_gigs);
  return parseFloat(((1 / distance_km) * equity_bonus).toFixed(4));
}

// ─── Dispatch Event ───────────────────────────────────────────────────────────

export const DispatchEventSchema = z.object({
  booking_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  dispatched_at: z.string().datetime(),
  expires_at: z.string().datetime(),     // 90-second acceptance lock
  attempt_number: z.number().int().min(1),
  equity_score: z.number(),
});
export type DispatchEvent = z.infer<typeof DispatchEventSchema>;

// ─── Realtime Notification Payloads ──────────────────────────────────────────

export const IncomingJobPayloadSchema = z.object({
  type: z.literal("INCOMING_JOB"),
  booking_id: z.string().uuid(),
  service_title: z.string(),
  category: z.string(),
  address: z.string(),
  distance_km: z.number(),
  total_amount: z.number(),
  worker_payout: z.number(),
  expires_in_seconds: z.number().default(90),
  customer_name: z.string(),
});
export type IncomingJobPayload = z.infer<typeof IncomingJobPayloadSchema>;

export const JobStatusUpdatePayloadSchema = z.object({
  type: z.literal("JOB_STATUS_UPDATE"),
  booking_id: z.string().uuid(),
  new_status: z.string(),
  message: z.string().optional(),
});
export type JobStatusUpdatePayload = z.infer<typeof JobStatusUpdatePayloadSchema>;

export const SafetyCheckInPayloadSchema = z.object({
  type: z.literal("SAFETY_CHECKIN_REQUIRED"),
  booking_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  next_checkin_at: z.string().datetime(),
});
export type SafetyCheckInPayload = z.infer<typeof SafetyCheckInPayloadSchema>;
