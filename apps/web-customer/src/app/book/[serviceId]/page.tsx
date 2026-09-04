import React from "react";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { BookingForm } from "@/components/BookingForm";
import { FeeBreakdownCard } from "@shram-sangam/ui-kit";
import { computeFeeBreakdown } from "@shram-sangam/shared-types";
import type { Service } from "@shram-sangam/shared-types";

interface Props {
  params: { serviceId: string };
}

async function getService(id: string): Promise<Service | null> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();
  return data as Service | null;
}

export default async function BookServicePage({ params }: Props) {
  const service = await getService(params.serviceId);
  if (!service) notFound();

  // Preview breakdown at base_rate × min_hours
  const previewAmount = service.base_rate * service.min_hours;
  const previewBreakdown = computeFeeBreakdown(previewAmount);

  return (
    <div className="space-y-6 py-4 max-w-xl mx-auto">
      {/* Service Header */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="font-bold text-slate-800">{service.title}</h1>
            <p className="text-xs text-slate-500">{service.category}</p>
          </div>
        </div>
        {service.description && (
          <p className="text-sm text-slate-600 pt-1">{service.description}</p>
        )}
        <p className="text-sm font-semibold text-orange-600">
          ₹{service.base_rate}/{service.unit}
          <span className="font-normal text-slate-400 ml-1">
            · min {service.min_hours} {service.unit}
          </span>
        </p>
      </div>

      {/* Fee preview */}
      <FeeBreakdownCard
        breakdown={previewBreakdown}
        serviceName={`${service.title} (${service.min_hours} ${service.unit})`}
      />

      {/* Booking Form */}
      <BookingForm service={service} />
    </div>
  );
}
