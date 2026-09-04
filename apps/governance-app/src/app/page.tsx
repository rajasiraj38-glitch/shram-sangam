// src/app/page.tsx — Proposals list (the hackathon showcase page)
'use client';

import { useEffect, useState } from 'react';
import { Plus, Vote, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, NavBar, QuorumGauge, useToast, Spinner, Modal, Input, Textarea } from '@shram-sangam/ui-kit';
import { timeUntil } from '@shram-sangam/ui-kit';
import { api } from '@/lib/api';
import { useGovUser } from '@/hooks/use-gov-user';
import { getSupabase } from '@/lib/supabase';
import type { Proposal } from '@shram-sangam/shared-types';

const STATUS_CONFIG: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'purple'; icon: React.ElementType }> = {
  active:        { variant: 'info',    icon: Clock },
  passed:        { variant: 'success', icon: CheckCircle2 },
  rejected:      { variant: 'danger',  icon: XCircle },
  quorum_not_met:{ variant: 'warning', icon: AlertCircle },
  enacted:       { variant: 'purple',  icon: CheckCircle2 },
  draft:         { variant: 'default', icon: Clock },
};

const CATEGORIES = ['Fee Adjustment', 'Fund Allocation', 'Policy Change', 'Platform Feature', 'Guild Rule', 'Emergency Motion'];

export default function ProposalsPage() {
  const { user, login }  = useGovUser();
  const { toast }        = useToast();
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [voting, setVoting]         = useState<string | null>(null);
  const [formOpen, setFormOpen]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // New proposal form state
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [category, setCategory] = useState(CATEGORIES[0] ?? 'Fee Adjustment');
  const [feePercent, setFee]    = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });

  const fetchProposals = () => {
    api.proposals.list()
      .then(setProposals)
      .catch(() => toast('error', 'Failed to load proposals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProposals();

    // Realtime: live vote tally updates
    const supabase = getSupabase();
    const ch = supabase
      .channel('proposals-tally')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'proposals' },
        (payload) => {
          setProposals(prev => prev.map(p => p.id === payload.new['id'] ? { ...p, ...payload.new } as Proposal : p));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function castVote(proposalId: string, decision: 'yes' | 'no' | 'abstain') {
    if (!user) { toast('warning', 'Please log in to vote'); return; }
    setVoting(proposalId + decision);
    try {
      await api.votes.cast(proposalId, decision);
      toast('success', 'Vote cast!', '1 member, 1 vote');
      fetchProposals();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setVoting(null);
    }
  }

  async function handleCreateProposal() {
    if (!title || title.length < 5) { toast('warning', 'Title too short'); return; }
    if (!description || description.length < 20) { toast('warning', 'Description too short'); return; }
    setSubmitting(true);
    try {
      await api.proposals.create({
        title,
        description,
        category,
        deadline: new Date(deadline).toISOString(),
        proposed_platform_fee_percent: feePercent ? parseFloat(feePercent) : undefined,
      });
      toast('success', 'Proposal submitted!', 'Members can now vote');
      setFormOpen(false);
      setTitle(''); setDesc(''); setFee('');
      fetchProposals();
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
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(o => !o)}
        items={[
          { label: 'Proposals', href: '/', active: true },
          { label: 'Treasury',  href: '/treasury' },
          { label: 'Disputes',  href: '/disputes' },
        ]}
        rightSlot={
          !user
            ? <Button size="sm" onClick={() => login('worker_member')}>Demo Login</Button>
            : <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Propose</Button>
        }
      />

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Democratic Assembly</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every verified member has exactly 1 vote. Proposals pass with ≥50% quorum and ≥66% yes votes.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" label="Loading proposals…" /></div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Vote className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No proposals yet</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>Create first proposal</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => {
              const cfg   = STATUS_CONFIG[p.status] ?? STATUS_CONFIG['draft']!;
              const Icon  = cfg.icon;
              const isActive = p.status === 'active' && new Date(p.deadline) > new Date();

              return (
                <Card key={p.id} padding="lg">
                  {/* Proposal header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline">{p.category}</Badge>
                        <Badge variant={cfg.variant}>
                          <Icon className="h-3 w-3" />
                          {p.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h2 className="font-bold text-gray-900">{p.title}</h2>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-3">{p.description}</p>
                      {p.proposed_platform_fee_percent != null && (
                        <p className="mt-1 text-xs font-medium text-brand-600">
                          Proposes fee: {p.proposed_platform_fee_percent}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Clock className="h-3.5 w-3.5" />
                    {isActive ? (
                      <span className="text-coop-green font-medium">{timeUntil(p.deadline)}</span>
                    ) : (
                      <span>Closed</span>
                    )}
                  </div>

                  {/* Quorum gauge */}
                  <QuorumGauge
                    votesYes={p.votes_yes}
                    votesNo={p.votes_no}
                    votesAbstain={p.votes_abstain}
                    totalEligible={p.total_eligible_voters}
                    quorumThreshold={p.quorum_threshold}
                    passThreshold={p.pass_threshold}
                    className="mb-4"
                  />

                  {/* Vote buttons — only for active proposals */}
                  {isActive && user?.role === 'worker_member' && (
                    <div className="flex gap-2">
                      {(['yes', 'no', 'abstain'] as const).map((d) => (
                        <Button
                          key={d}
                          variant={d === 'yes' ? 'success' : d === 'no' ? 'danger' : 'secondary'}
                          size="sm"
                          fullWidth
                          loading={voting === p.id + d}
                          disabled={!!voting}
                          onClick={() => castVote(p.id, d)}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* New proposal modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Proposal" size="lg">
        <div className="space-y-3">
          <Input
            label="Title"
            placeholder="e.g. Reduce platform fee from 7% to 5%"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Textarea
            label="Description"
            placeholder="Explain your reasoning, the impact, and supporting data…"
            rows={4}
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
          {category === 'Fee Adjustment' && (
            <Input
              label="Proposed platform fee (%)"
              type="number"
              min="0"
              max="30"
              step="0.5"
              placeholder="e.g. 5"
              value={feePercent}
              onChange={e => setFee(e.target.value)}
              hint="Leave blank for non-fee proposals"
            />
          )}
          <Input
            label="Voting deadline"
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <Button fullWidth loading={submitting} onClick={handleCreateProposal}>
            Submit Proposal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
