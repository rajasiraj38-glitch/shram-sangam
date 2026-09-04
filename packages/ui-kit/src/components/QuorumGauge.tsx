import React from "react";
import { cn } from "../utils/cn";
import type { QuorumResult } from "@shram-sangam/shared-types";

// ─── Circular Progress Ring ───────────────────────────────────────────────────

function ProgressRing({
  percent,
  size = 80,
  stroke = 8,
  color,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} aria-hidden="true">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Quorum Gauge ─────────────────────────────────────────────────────────────

export interface QuorumGaugeProps {
  result: QuorumResult;
  className?: string;
}

export function QuorumGauge({ result, className }: QuorumGaugeProps) {
  const {
    votes_yes,
    votes_no,
    votes_abstain,
    total_cast,
    total_eligible,
    quorum_percent,
    pass_percent,
    quorum_met,
    outcome,
  } = result;

  const outcomeConfig = {
    passed:         { label: "Passed",         bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700" },
    rejected:       { label: "Rejected",        bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700"     },
    quorum_not_met: { label: "Quorum Not Met",  bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700"   },
  };

  const oc = outcomeConfig[outcome];

  return (
    <div className={cn("rounded-2xl border bg-white shadow-card p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Vote Tally</h3>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
            oc.bg, oc.border, oc.text
          )}
        >
          {oc.label}
        </span>
      </div>

      {/* Rings row */}
      <div className="flex items-center justify-around">
        {/* Quorum */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <ProgressRing
              percent={quorum_percent}
              color={quorum_met ? "#14b8a6" : "#f59e0b"}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">
                {quorum_percent.toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">Quorum</p>
          <p className="text-xs text-slate-400">{total_cast}/{total_eligible}</p>
        </div>

        {/* Pass rate */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <ProgressRing
              percent={pass_percent}
              color={pass_percent >= 66 ? "#10b981" : "#ef4444"}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">
                {pass_percent.toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">Yes Rate</p>
          <p className="text-xs text-slate-400">need 66%</p>
        </div>
      </div>

      {/* Vote breakdown bar */}
      <div>
        <div
          className="flex h-3 rounded-full overflow-hidden"
          role="img"
          aria-label={`${votes_yes} yes, ${votes_no} no, ${votes_abstain} abstain`}
        >
          {total_cast > 0 && (
            <>
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(votes_yes / total_cast) * 100}%` }}
              />
              <div
                className="bg-red-400 transition-all duration-500"
                style={{ width: `${(votes_no / total_cast) * 100}%` }}
              />
              <div
                className="bg-slate-300 transition-all duration-500"
                style={{ width: `${(votes_abstain / total_cast) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1.5">
          <span className="text-emerald-600 font-medium">✓ {votes_yes} Yes</span>
          <span className="text-red-500 font-medium">✗ {votes_no} No</span>
          <span className="text-slate-400">— {votes_abstain} Abstain</span>
        </div>
      </div>
    </div>
  );
}
