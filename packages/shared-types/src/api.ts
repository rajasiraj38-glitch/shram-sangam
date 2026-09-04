import { z } from "zod";

// ─── Standard API Response Wrapper ───────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, message?: string): ApiSuccess<T> {
  return { success: true, data, message };
}

export function apiError(
  error: string,
  code?: string,
  details?: Record<string, string[]>
): ApiError {
  return { success: false, error, code, details };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ─── AI Scope Request ─────────────────────────────────────────────────────────

export const AIScopeRequestSchema = z.object({
  description: z.string().min(10).max(1000),
  image_base64: z.string().optional(),
  service_category: z.string().optional(),
});
export type AIScopeRequest = z.infer<typeof AIScopeRequestSchema>;

// ─── OTP Verification ─────────────────────────────────────────────────────────

export const VerifyOTPSchema = z.object({
  booking_id: z.string().uuid(),
  otp: z.string().length(6),
});
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;

// ─── Safety SOS ───────────────────────────────────────────────────────────────

export const SOSPayloadSchema = z.object({
  booking_id: z.string().uuid(),
  worker_id: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string().datetime(),
});
export type SOSPayload = z.infer<typeof SOSPayloadSchema>;
