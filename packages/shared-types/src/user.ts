import { z } from "zod";

// ─── Role Definitions ────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum([
  "customer",
  "worker_member",
  "admin_coop",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// ─── Profile Schema ───────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  role: UserRoleSchema,
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
  coop_shares: z.number().int().min(0).default(1),
  is_available: z.boolean().default(false),      // Worker availability toggle
  latitude: z.number().optional(),               // Last known location
  longitude: z.number().optional(),
  language_preference: z.string().default("hi"), // hi=Hindi, en=English, etc.
  guild_category: z.string().optional(),         // e.g. "Plumbing", "Electrical"
  is_verified: z.boolean().default(false),       // Peer-vouched KYC status
  vouched_by: z.array(z.string().uuid()).default([]), // Peer endorsers
  created_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ─── Onboarding / Registration ────────────────────────────────────────────────

export const RegisterCustomerSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email().optional(),
  language_preference: z.string().default("hi"),
});
export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>;

export const RegisterWorkerSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
  email: z.string().email().optional(),
  guild_category: z.string().min(2),
  language_preference: z.string().default("hi"),
  voucher_ids: z
    .array(z.string().uuid())
    .min(2, "Need 2 existing member endorsements"),
});
export type RegisterWorkerInput = z.infer<typeof RegisterWorkerSchema>;
