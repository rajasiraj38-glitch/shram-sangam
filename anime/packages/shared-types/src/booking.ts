import { z } from "zod";

// ─── Booking Status State Machine ─────────────────────────────────────────────
// requested → accepted → arrived → in_progress → completed
//                      ↘ cancelled (from requested/accepted only)

export const BookingStatusSchema = z.enum([
  "requested",
  "accepted",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

// Valid state transitions
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["arrived", "cancelled"],
  arrived: ["in_progress"],
  in_progress: ["completed", "disputed"],
  completed: [],
  cancelled: [],
  disputed: ["completed", "cancelled"],
};

// ─── Service Catalog ──────────────────────────────────────────────────────────

export const ServiceCategorySchema = z.enum([
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Caregiving",
  "Cleaning",
  "Appliance Repair",
  "Painting",
  "Other",
]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(120),
  category: ServiceCategorySchema,
  description: z.string().optional(),
  base_rate: z.number().positive(),     // Rate in INR
  unit: z.enum(["hour", "visit", "job"]).default("hour"),
  min_hours: z.number().default(1),
  icon_name: z.string().optional(),     // Lucide icon name for UI
  is_active: z.boolean().default(true),
});
export type Service = z.infer<typeof ServiceSchema>;

// ─── Transparent Fee Breakdown ────────────────────────────────────────────────

export const FeeBreakdownSchema = z.object({
  total_amount: z.number().positive(),
  worker_payout: z.number().positive(),           // 90% of total
  coop_reserve_fee: z.number().nonnegative(),     // 7% of total
  mutual_aid_contribution: z.number().nonnegative(), // 3% of total
});
export type FeeBreakdown = z.infer<typeof FeeBreakdownSchema>;

/**
 * Pure function: compute the 90/7/3 cooperative fee breakdown
 */
export function computeFeeBreakdown(totalAmount: number): FeeBreakdown {
  return {
    total_amount: totalAmount,
    worker_payout: parseFloat((totalAmount * 0.9).toFixed(2)),
    coop_reserve_fee: parseFloat((totalAmount * 0.07).toFixed(2)),
    mutual_aid_contribution: parseFloat((totalAmount * 0.03).toFixed(2)),
  };
}

// ─── AI Scope Estimate ────────────────────────────────────────────────────────

export const DifficultyTierSchema = z.enum(["Standard", "Complex", "Emergency"]);
export type DifficultyTier = z.infer<typeof DifficultyTierSchema>;

export const AIScopeEstimateSchema = z.object({
  standard_hours: z.number().positive(),
  difficulty_tier: DifficultyTierSchema,
  parts_estimate_inr: z.number().nonnegative(),
  recommended_base_price: z.number().positive(),
  confidence_score: z.number().min(0).max(1),
  notes: z.string().optional(),
});
export type AIScopeEstimate = z.infer<typeof AIScopeEstimateSchema>;

// ─── Booking Schema ───────────────────────────────────────────────────────────

export const BookingSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  worker_id: z.string().uuid().nullable(),
  service_id: z.string().uuid(),
  status: BookingStatusSchema,

  // Transparent fee breakdown (immutable once created)
  total_amount: z.number().positive(),
  worker_payout: z.number().positive(),
  coop_reserve_fee: z.number().nonnegative(),
  mutual_aid_contribution: z.number().nonnegative(),

  // Job details
  address: z.string().min(10),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  scheduled_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),

  // AI Scope (optional if customer uploaded media)
  ai_estimate: AIScopeEstimateSchema.optional(),

  // Completion / verification
  completion_otp: z.string().length(6).optional(),
  completed_at: z.string().datetime().optional(),

  // Dispute
  dispute_reason: z.string().optional(),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Booking = z.infer<typeof BookingSchema>;

// ─── Request / Response Payloads ──────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  service_id: z.string().uuid(),
  address: z.string().min(10),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  scheduled_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  // If provided, total_amount comes from AI estimate; otherwise from service base_rate
  total_amount: z.number().positive(),
});
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingStatusSchema = z.object({
  booking_id: z.string().uuid(),
  new_status: BookingStatusSchema,
  completion_otp: z.string().length(6).optional(),
  dispute_reason: z.string().optional(),
});
export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;
