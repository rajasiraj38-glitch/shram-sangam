"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, FileText, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  FeeBreakdownCard,
  useToast,
} from "@shram-sangam/ui-kit";
import { computeFeeBreakdown } from "@shram-sangam/shared-types";
import { createBooking } from "@/lib/actions";
import type { Service } from "@shram-sangam/shared-types";

export function BookingForm({ service }: { service: Service }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [address, setAddress] = useState("");
  const [hours, setHours] = useState(service.min_hours);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAmount = service.base_rate * hours;
  const breakdown = computeFeeBreakdown(totalAmount);

  function validate() {
    const e: Record<string, string> = {};
    if (address.trim().length < 10) e.address = "Please enter a full address (min 10 characters)";
    if (hours < service.min_hours) e.hours = `Minimum booking is ${service.min_hours} ${service.unit}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await createBooking({
        service_id: service.id,
        address: address.trim(),
        scheduled_at: scheduledAt || undefined,
        notes: notes.trim() || undefined,
        total_amount: totalAmount,
      });

      if (result.success && result.booking_id) {
        toast.success("Booking Requested!", "A verified worker will be dispatched shortly.");
        router.push(`/bookings/${result.booking_id}`);
      } else {
        toast.error("Booking Failed", result.error ?? "Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4 space-y-4">
        <h2 className="font-semibold text-slate-800">Booking Details</h2>

        {/* Address */}
        <Textarea
          label="Service Address"
          placeholder="Flat no., Building, Street, Area, City, PIN"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={errors.address}
          required
          rows={2}
        />

        {/* Hours */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Duration ({service.unit}s)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHours(Math.max(service.min_hours, hours - 0.5))}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Decrease duration"
            >
              −
            </button>
            <span className="text-lg font-bold text-slate-800 w-12 text-center">
              {hours}
            </span>
            <button
              type="button"
              onClick={() => setHours(hours + 0.5)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Increase duration"
            >
              +
            </button>
            <span className="text-sm text-slate-400">{service.unit}(s)</span>
          </div>
          {errors.hours && (
            <p className="text-xs text-red-600" role="alert">{errors.hours}</p>
          )}
        </div>

        {/* Schedule */}
        <Input
          label="Preferred Date & Time (optional)"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          leftAddon={<Calendar size={14} />}
          min={new Date().toISOString().slice(0, 16)}
        />

        {/* Notes */}
        <Textarea
          label="Additional Notes (optional)"
          placeholder="E.g. Ring doorbell twice, 3rd floor, no lift..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Live fee breakdown updates as hours change */}
      <FeeBreakdownCard
        breakdown={breakdown}
        serviceName={`${service.title} × ${hours} ${service.unit}`}
        compact
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
        leftIcon={<MapPin size={18} />}
      >
        {isPending ? "Requesting..." : `Request Service — ₹${totalAmount.toFixed(0)}`}
      </Button>

      <p className="text-center text-xs text-slate-400">
        No payment charged until the job is completed and you approve the OTP.
      </p>
    </form>
  );
}
