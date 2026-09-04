"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@shram-sangam/ui-kit";
import type { ServiceCategory } from "@shram-sangam/shared-types";

const CATEGORY_EMOJI: Record<string, string> = {
  Plumbing:           "🔧",
  Electrical:         "⚡",
  Carpentry:          "🪚",
  Caregiving:         "🤲",
  Cleaning:           "✨",
  "Appliance Repair": "🔌",
  Painting:           "🖌️",
  Other:              "🛠️",
};

export function ServiceCategoryFilter({
  categories,
  active,
}: {
  categories: ServiceCategory[];
  active?: ServiceCategory;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="navigation"
      aria-label="Filter by category"
    >
      {/* All */}
      <Link
        href="/services"
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
          "border transition-colors",
          !active
            ? "bg-orange-500 text-white border-orange-500"
            : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
        )}
        aria-current={!active ? "true" : undefined}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat}
          href={`/services?category=${encodeURIComponent(cat)}`}
          className={cn(
            "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            "border transition-colors",
            active === cat
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
          )}
          aria-current={active === cat ? "true" : undefined}
        >
          <span aria-hidden="true">{CATEGORY_EMOJI[cat] ?? "🛠️"}</span>
          {cat}
        </Link>
      ))}
    </div>
  );
}
