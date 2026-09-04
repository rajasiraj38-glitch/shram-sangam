// src/app/mutual-aid/page.tsx — File and view mutual aid claims
'use client';

import { useEffect, useState } from 'react';
import { Heart, Plus, Upload } from 'lucide-react';
import { Button, Card, Badge, NavBar, useToast, Spinner, Input, Textarea, Modal } from '@shram-sangam/ui-kit';
import { formatINR, formatDate } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useWorker } from '@/hooks/use-worker';

const CLAIM_TYPE_LABELS: Record<string, string> = {
  tool_replacement:  'Tool Replacement',
  medical_emergency: 'Medical Emergency',
  accident_on_site:  'On-site Accident',
  other:             'Other',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'purple'> = {
  pending_review: 'warning',
  peer_review:    'info',
  approved:       'success',
  rejected:       'danger',
  disbursed:      'purple',
};

export default function MutualAidPage() {
  const { worker }   = useWorker();
  const { toast }    = useToast();
  const [claims, setClaims]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [claimType, setClaimType]   = useState<string>('tool_replacement');
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const fetchClaims = () => {
    api.mutualAid.list()
      .then(setClaims)
      .catch(() => toast('error', 'Failed to load claims'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const e: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) e['amount'] = 'Enter a valid amount';
    if (amt > 15000) e['amount'] = 'Maximum claim is ₹15,000';
    if (!description || description.length < 20) e['description'] = 'Describe the situation (min 20 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.mutualAid.create({
        claim_type:       claimType as any,
        amount_requested: parseFloat(amount),
        description,
      });
      toast('success', 'Claim submitted!', 'Peers will review within 48 hours');
      setFormOpen(false);
      setAmount(''); setDescription(''); setClaimType('tool_replacement');
      fetchClaims();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        appName="Worker Dashboard"
        role="worker_member"
        userName={worker?.full_name}
        items={[
          { label: 'Radar',    href: '/' },
          { label: 'Earnings', href: '/earnings' },
          { label: 'Mutual Aid', href: '/mutual-aid', active: true },
        ]}
      />

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mutual Aid Fund</h1>
            <p className="text-xs text-gray-500 mt-0.5">3% of every job goes into this collective safety net</p>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New Claim
          </Button>
        </div>

        {/* Explainer */}
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-coop-purple flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-purple-800">How it works</p>
              <ul className="text-purple-700 mt-1 space-y-0.5 text-xs">
                <li>• Available for tool replacement, medical, or on-site accidents</li>
                <li>• Maximum ₹15,000 per claim</li>
                <li>• 2 peer co-op members must approve the claim</li>
                <li>• Disbursed automatically once approved</li>
                <li>• Requires ≥20 completed gigs to be eligible</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Claims list */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner label="Loading claims…" /></div>
        ) : claims.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No claims filed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim: any) => (
              <Card key={claim.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">
                        {CLAIM_TYPE_LABELS[claim.claim_type] ?? claim.claim_type}
                      </p>
                      <Badge variant={STATUS_VARIANTS[claim.status] ?? 'default'}>
                        {claim.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{claim.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>Filed {formatDate(claim.created_at)}</span>
                      {claim.peer_approvals?.length > 0 && (
                        <span>{claim.peer_approvals.length} peer approval(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-coop-purple">{formatINR(claim.amount_requested)}</p>
                    {claim.approved_amount && (
                      <p className="text-xs text-coop-green">Approved: {formatINR(claim.approved_amount)}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* New claim modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="File a Mutual Aid Claim"
        description="Provide honest details. Peers will review your claim."
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Claim type</label>
            <select
              value={claimType}
              onChange={(e) => setClaimType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {Object.entries(CLAIM_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <Input
            label="Amount requested (₹)"
            placeholder="e.g. 3500"
            type="number"
            min="1"
            max="15000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors['amount']}
            hint="Maximum ₹15,000 per claim"
          />
          <Textarea
            label="Describe the situation"
            placeholder="What happened? When? What do you need the funds for?"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors['description']}
          />
          <Button fullWidth loading={submitting} onClick={handleSubmit}>
            <Upload className="h-4 w-4" /> Submit Claim
          </Button>
        </div>
      </Modal>
    </div>
  );
}
