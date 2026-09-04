// src/lib/api.ts
import type { Proposal, Vote, CoopFinancials, Dispute, ApiResponse } from '@shram-sangam/shared-types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error((json as { error: string }).error ?? 'Request failed');
  return (json as { success: true; data: T }).data;
}

export const api = {
  proposals: {
    list: ()                     => apiFetch<Proposal[]>('/api/proposals'),
    get:  (id: string)           => apiFetch<Proposal>(`/api/proposals/${id}`),
    create: (body: unknown)      => apiFetch<Proposal>('/api/proposals', { method: 'POST', body: JSON.stringify(body) }),
  },
  votes: {
    cast: (proposalId: string, decision: 'yes' | 'no' | 'abstain') =>
      apiFetch<Vote>('/api/votes', { method: 'POST', body: JSON.stringify({ proposal_id: proposalId, decision }) }),
    forProposal: (proposalId: string) =>
      apiFetch<Vote[]>(`/api/votes?proposal_id=${proposalId}`),
  },
  treasury: {
    summary: () => apiFetch<CoopFinancials>('/api/treasury'),
  },
  disputes: {
    list: ()                   => apiFetch<Dispute[]>('/api/disputes'),
    get:  (id: string)         => apiFetch<Dispute>(`/api/disputes/${id}`),
    vote: (id: string, verdict: string, workerPct?: number) =>
      apiFetch<Dispute>(`/api/disputes/${id}/vote`, { method: 'POST', body: JSON.stringify({ verdict, worker_payout_percent: workerPct }) }),
  },
  auth: {
    demo: (role: string) =>
      apiFetch<{ profile: { id: string; full_name: string; role: string } }>(`/api/demo-login?role=${role}`),
  },
};
