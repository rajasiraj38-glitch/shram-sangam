// src/app/earnings/page.tsx — Worker earnings + patronage dashboard
'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Star, Coins, Award, Briefcase } from 'lucide-react';
import { StatBox, Card, NavBar, useToast, Spinner } from '@shram-sangam/ui-kit';
import { formatINR } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useWorker } from '@/hooks/use-worker';

export default function EarningsPage() {
  const { worker }   = useWorker();
  const { toast }    = useToast();
  const [summary, setSummary]   = useState<any>(null);
  const [history, setHistory]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.earnings.summary(), api.jobs.history()])
      .then(([s, h]) => { setSummary(s); setHistory(h); })
      .catch(() => toast('error', 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Worker Dashboard"
        role="worker_member"
        userName={worker?.full_name}
        items={[
          { label: 'Radar',    href: '/',        icon: () => null },
          { label: 'Earnings', href: '/earnings', active: true },
          { label: 'Mutual Aid', href: '/mutual-aid' },
        ]}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <h1 className="text-lg font-bold text-gray-900">Earnings & Cooperative Share</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" label="Loading earnings…" /></div>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label={`Earned this month (${summary?.month})`}
                value={formatINR(summary?.total_earned ?? 0)}
                icon={TrendingUp}
                iconColor="text-coop-green"
                iconBg="bg-green-50"
              />
              <StatBox
                label="Jobs completed"
                value={summary?.total_jobs ?? 0}
                icon={Briefcase}
                iconColor="text-coop-blue"
                iconBg="bg-blue-50"
              />
              <StatBox
                label="Patronage points"
                value={summary?.total_points ?? 0}
                icon={Star}
                iconColor="text-yellow-500"
                iconBg="bg-yellow-50"
                sublabel="1 point per ₹10 earned"
              />
              <StatBox
                label="Co-op shares owned"
                value={summary?.coop_shares ?? 1}
                icon={Award}
                iconColor="text-coop-purple"
                iconBg="bg-purple-50"
                sublabel="1 share per 50 points"
              />
            </div>

            {/* Estimated dividend */}
            <Card className="border-brand-200 bg-brand-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                  <Coins className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-brand-700 uppercase tracking-wide">Estimated Month-End Dividend</p>
                  <p className="text-2xl font-bold text-brand-600">{formatINR(summary?.estimated_dividend ?? 0)}</p>
                  <p className="text-xs text-brand-500">
                    Your proportional share of the 7% cooperative operational surplus
                  </p>
                </div>
              </div>
            </Card>

            {/* Cooperative explainer */}
            <Card className="bg-gray-50 border-gray-200">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">How cooperative ownership works</p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li>• <strong>90%</strong> of each job payment goes directly to you</li>
                <li>• You earn 1 patronage point per ₹10 earned</li>
                <li>• Every 50 points converts to 1 cooperative share</li>
                <li>• Shares entitle you to monthly dividends from platform surplus</li>
                <li>• You vote on platform decisions with 1-member-1-vote power</li>
              </ul>
            </Card>

            {/* Job history */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Recent Jobs</h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No completed jobs yet</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 10).map((job: any) => (
                    <Card key={job.id} padding="sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{job.services?.title}</p>
                          <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-coop-green">{formatINR(job.worker_payout)}</p>
                          <p className="text-xs text-gray-400 capitalize">{job.status}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
