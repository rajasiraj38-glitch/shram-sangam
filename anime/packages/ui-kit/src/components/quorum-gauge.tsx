// packages/ui-kit/src/components/quorum-gauge.tsx
// Visual quorum progress gauge for governance proposals

import React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './badge';

export interface QuorumGaugeProps {
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  totalEligible: number;
  quorumThreshold?: number;  // default 0.5
  passThreshold?: number;    // default 0.66
  className?: string;
}

export function QuorumGauge({
  votesYes,
  votesNo,
  votesAbstain,
  totalEligible,
  quorumThreshold = 0.5,
  passThreshold = 0.66,
  className,
}: QuorumGaugeProps) {
  const totalCast = votesYes + votesNo + votesAbstain;
  const quorumPct = totalEligible > 0 ? totalCast / totalEligible : 0;
  const yesPct = totalCast > 0 ? votesYes / totalCast : 0;
  const noPct = totalCast > 0 ? votesNo / totalCast : 0;
  const abstainPct = totalCast > 0 ? votesAbstain / totalCast : 0;

  const quorumMet = quorumPct >= quorumThreshold;
  const wouldPass = quorumMet && yesPct >= passThreshold;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quorum progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Quorum — {totalCast} / {totalEligible} members voted</span>
          <span className={quorumMet ? 'text-coop-green font-medium' : 'text-gray-400'}>
            {Math.round(quorumPct * 100)}% / {Math.round(quorumThreshold * 100)}% needed
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', quorumMet ? 'bg-coop-green' : 'bg-yellow-400')}
            style={{ width: `${Math.min(quorumPct * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Vote breakdown bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Vote breakdown</span>
          <span>{Math.round(yesPct * 100)}% yes needed: {Math.round(passThreshold * 100)}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden flex">
          <div
            className="h-full bg-coop-green transition-all duration-500"
            style={{ width: `${yesPct * 100}%` }}
            title={`Yes: ${votesYes}`}
          />
          <div
            className="h-full bg-coop-red transition-all duration-500"
            style={{ width: `${noPct * 100}%` }}
            title={`No: ${votesNo}`}
          />
          <div
            className="h-full bg-gray-400 transition-all duration-500"
            style={{ width: `${abstainPct * 100}%` }}
            title={`Abstain: ${votesAbstain}`}
          />
        </div>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-coop-green">
            <span className="h-2 w-2 rounded-full bg-coop-green inline-block" />
            Yes: {votesYes}
          </span>
          <span className="flex items-center gap-1 text-xs text-coop-red">
            <span className="h-2 w-2 rounded-full bg-coop-red inline-block" />
            No: {votesNo}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
            Abstain: {votesAbstain}
          </span>
        </div>
      </div>

      {/* Projected outcome */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Projected outcome:</span>
        {!quorumMet ? (
          <Badge variant="warning">Quorum not yet met</Badge>
        ) : wouldPass ? (
          <Badge variant="success">On track to pass</Badge>
        ) : (
          <Badge variant="danger">On track to fail</Badge>
        )}
      </div>
    </div>
  );
}
