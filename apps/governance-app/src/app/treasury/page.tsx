// src/app/treasury/page.tsx — Public cooperative treasury ledger
'use client';

import { useEffect, useState } from 'react';
import { Shield, Heart, Users, Briefcase, TrendingUp, DollarSign } from 'lucide-react';
import { StatBox, Card, NavBar, useToast, Spinner } from '@shram-sangam/ui-kit';
import { formatINR, formatDate } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useGovUser } from '@/hooks/use-gov-user';

export default function TreasuryPage() {
  const { user }     = useGovUser();
  const { toast }    = useToast();
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.treasury.summary()
      .then(setData)
      .catch(() => toast('error', 'Failed to load treasury'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Co-op Assembly"
        role={user?.role as 'worker_member' | 'admin_coop' | undefined}
        userName={user?.full_name}
        items={[
          { label: 'Proposals', href: '/' },
          { label: 'Treasury',  href: '/treasury', active: true },
          { label: 'Disputes',  href: '/disputes' },
        ]}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cooperative Treasury</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fully transparent — every member can see where money flows. No hidden fees.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" label="Loading treasury…" /></div>
        ) : (
          <>
            {/* Main pool stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Operational Reserve (7% pool)"
                value={formatINR(data?.operational_reserve ?? 0)}
                icon={Shield}
                iconColor="text-coop-blue"
                iconBg="bg-blue-50"
                sublabel="Server, support & admin costs"
              />
              <StatBox
                label="Mutual Aid Reserve (3% pool)"
                value={formatINR(data?.mutual_aid_reserve ?? 0)}
                icon={Heart}
                iconColor="text-coop-purple"
                iconBg="bg-purple-50"
                sublabel="Worker emergency fund"
              />
              <StatBox
                label="Total Paid to Workers"
                value={formatINR(data?.total_disbursed_to_workers ?? 0)}
                icon={TrendingUp}
                iconColor="text-coop-green"
                iconBg="bg-green-50"
                sublabel="90% of all bookings"
              />
              <StatBox
                label="Gigs Completed"
                value={data?.total_gigs_completed ?? 0}
                icon={Briefcase}
                iconColor="text-brand-500"
                iconBg="bg-brand-50"
              />
            </div>

            {/* Cooperative membership */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Verified Members"
                value={data?.total_verified_members ?? 0}
                icon={Users}
                iconColor="text-gray-600"
                iconBg="bg-gray-100"
                sublabel="Peer-vouched worker-owners"
              />
              <StatBox
                label="Total Completed Gigs"
                value={data?.total_completed_gigs ?? 0}
                icon={DollarSign}
                iconColor="text-green-600"
                iconBg="bg-green-50"
              />
            </div>

            {/* How it works */}
            <Card>
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Where Every Rupee Goes</h2>
              <div className="space-y-3">
                {[
                  { pct: '90%', label: 'Direct to Worker', desc: 'Paid immediately on OTP-verified job completion', color: 'bg-coop-green', text: 'text-coop-green' },
                  { pct: '7%',  label: 'Operational Reserve', desc: 'Servers, payment processing, support. Surplus returned to members as dividends', color: 'bg-coop-blue', text: 'text-coop-blue' },
                  { pct: '3%',  label: 'Mutual Aid Fund', desc: 'Tool replacement grants, medical emergencies, on-site accidents', color: 'bg-coop-purple', text: 'text-coop-purple' },
                ].map(r => (
                  <div key={r.pct}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-semibold ${r.text}`}>{r.pct} — {r.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div className={`h-full rounded-full ${r.color}`} style={{ width: r.pct }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Period info */}
            {data?.period_start && (
              <p className="text-xs text-gray-400 text-center">
                Current period started {formatDate(data.period_start)} · Updated continuously
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
