"use server";

import { createServerSupabase } from "./supabase-server";
import {
  computeFeeBreakdown,
  CreateBookingSchema,
  type CreateBookingInput,
  type Service,
  type Booking,
} from "@shram-sangam/shared-types";

// ─── Fetch Service Catalog ────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("category");

  if (error) throw new Error(error.message);
  return data as Service[];
}

// ─── Fetch Customer's Bookings ────────────────────────────────────────────────

export async function getMyBookings(): Promise<Booking[]> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*, 
       services(title, category, icon_name),
       worker:worker_id(full_name, phone, guild_category)`
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Booking[];
}

// ─── Create Booking ───────────────────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput
): Promise<{ success: boolean; booking_id?: string; error?: string }> {
  const parsed = CreateBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const breakdown = computeFeeBreakdown(input.total_amount);

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      service_id: input.service_id,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      scheduled_at: input.scheduled_at,
      notes: input.notes,
      total_amount: breakdown.total_amount,
      worker_payout: breakdown.worker_payout,
      coop_reserve_fee: breakdown.coop_reserve_fee,
      mutual_aid_contribution: breakdown.mutual_aid_contribution,
      status: "requested",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, booking_id: data.id };
}

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .eq("status", "requested"); // can only cancel open requests

  if (error) return { success: false, error: error.message };
  return { success: true };
}
