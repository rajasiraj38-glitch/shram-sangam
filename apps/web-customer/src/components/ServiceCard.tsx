"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, IndianRupee } from "lucide-react";
import { Badge } from "@shram-sangam/ui-kit";
import type { Service } from "@shram-sangam/shared-types";

const CATEGORY_COLORS: Record<string, "teal" | "orange" | "blue" | "lime" | "violet" | "gray"> = {
  Plumbing:         "blue",
  Electrical:       "orange",
  Carpentry:        "lime",
  Caregiving:       "teal",
  Cleaning:         "violet",
  "Appliance Repair": "gray",
  Painting:         "orange",
  Other:            "gray",
};

export function ServiceCard({ service }: { service: Service }) {
  const color = CATEGORY_COLORS[service.category] ?? "gray";

  return (
    <Link
      href={`/book/${service.id}`}
      className="group block rounded-2xl bg-white border border-slate-100 shadow-card
                 hover:shadow-card-hover hover:border-orange-200 transition-all duration-200 p-4"
      aria-label={`Book ${service.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
          {/* Emoji fallback until icon system is wired */}
          {service.icon_name ? "🔧" : "🛠️"}
        </div>
        <Badge label={service.category} color={color} />
      </div>

      <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1">
        {service.title}
      </h3>

      {service.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <IndianRupee size={12} aria-hidden="true" />
            <strong>₹{service.base_rate}</strong>/{service.unit}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock size={12} aria-hidden="true" />
            min {service.min_hours}h
          </span>
        </div>
        <ArrowRight
          size={16}
          className="text-slate-300 group-hover:text-orange-500 transition-colors"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
