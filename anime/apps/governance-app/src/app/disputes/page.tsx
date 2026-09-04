// src/app/disputes/page.tsx — Peer arbitration review room
'use client';

import { useEffect, useState } from 'react';
import { Scale, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, NavBar, useToast, Spinner, Modal } from '@shram-sangam/ui-kit';
import { formatINR, formatDate } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useGovUser } from '@/hooks/use-gov-user';

const VERDICT_LABELS: Record<string, string> = {
  full_refund_customer: 'Full Refund to Customer',
  full_payout_worker:   'Full Payout to Worker',
  partial_split:        'Partial Split',
  rebook_required:      'Rebook Required',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  filed:              'warning',
  jury_assembled:     'info',
  evidence_submitted: 'info',
  deliberating:       'info',
  resolved:           'success',
};

export default function DisputesPage() {
  const { user }      = useGovUser();
  const { toast }     = useToast();
  const [disputes, setDisputes]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<any>(null);
  const [verdict, setVerdict]     = useState('');
  const [workerPct, setWorkerPct] = useState('50');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = () => {
    api.disputes.list()
      .then(setDisputes)
      .catch(() => toast('error', 'Failed to load disputes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDisputes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitVerdict() {
    if (!selected || !verdict) return;
    setSubmitting(true);
    try {
      await api.disputes.vote(
        selected.id,
        verdict,
        verdict === 'partial_split' ? parseFloat(workerPct) : undefined,
      );
      toast('success', 'Verdict recorded');
      setSelected(null);
      fetchDisputes();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Co-op Assembly"
        role={user?.role as 'worker_member' | 'admin_coop' | undefined}
        userName={user?.full_name}
        items={[
          { label: 'Proposals', href: '/' },
          { label: 'Treasury',  href: '/treasury' },
          { label: 'Disputes',  href: '/disputes', active: true },
        ]}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peer Arbitration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Randomly selected jury members review disputed jobs and vote on fair outcomes.
          </p>
        </div>

        {!user && (
          <Card className="border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Log in as a worker member to see disputes you are assigned to as a jury member.
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" label="Loading disputes…" /></div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No disputes assigned to you</p>
            <p className="text-xs mt-1">Jury members are randomly selected from the co-op pool</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d: any) => (
              <Card key={d.id} hover onClick={() => setSelected(d)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_VARIANT[d.status] ?? 'default'}>
                        {d.status.replace(/_/g, ' ')}
                      </Badge>
                      {d.verdict && (
                        <Badge variant="success">{VERDICT_LABELS[d.verdict] ?? d.verdict}</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-gray-900">
                      {d.bookings?.services?.title ?? 'Service dispute'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">Filed {formatDate(d.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatINR(d.bookings?.total_amount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.jury_member_ids?.length ?? 0} juror(s)
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Verdict modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Jury Verdict"
        description={selected?.reason}
        size="md"
      >
        {selected && (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              <p><span className="text-gray-500">Service:</span> {selected.bookings?.services?.title}</p>
              <p><span className="text-gray-500">Total amount:</span> {formatINR(selected.bookings?.total_amount ?? 0)}</p>
              <p><span className="text-gray-500">Address:</span> {selected.bookings?.address}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Your verdict</label>
              <select
                value={verdict}
                onChange={e => setVerdict(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Select a verdict…</option>
                {Object.entries(VERDICT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {verdict === 'partial_split' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Worker payout %</label>
                <input
                  type="range" min="0" max="100" step="5"
                  value={workerPct}
                  onChange={e => setWorkerPct(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Worker: {workerPct}% ({formatINR((selected.bookings?.total_amount ?? 0) * parseFloat(workerPct) / 100)}) •
                  Customer refund: {100 - parseInt(workerPct)}%
                </p>
              </div>
            )}

            <Button
              fullWidth
              loading={submitting}
              disabled={!verdict}
              onClick={submitVerdict}
            >
              <Scale className="h-4 w-4" /> Submit Verdict
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
