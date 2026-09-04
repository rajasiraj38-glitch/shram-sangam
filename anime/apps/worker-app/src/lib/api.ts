// src/lib/api.ts — typed API client for worker-app
import type { Booking, MutualAidClaim, CreateMutualAidClaimInput, PatronageLedger } from '@shram-sangam/shared-types';
import type { ApiResponse } from '@shram-sangam/shared-types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error((json as { error: string }).error ?? 'Request failed');
  return (json as { success: true; data: T }).data;
}

export const api = {
  worker: {
    // Toggle availability on/off
    setAvailability: (available: boolean) =>
      apiFetch<{ is_available: boolean }>('/api/worker/availability', {
        method: 'PATCH',
        body: JSON.stringify({ is_available: available }),
      }),
    // Safety check-in (heartbeat)
    checkin: (bookingId: string) =>
      apiFetch<{ ok: boolean }>('/api/worker/checkin', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId }),
      }),
    // SOS emergency broadcast
    sos: (bookingId: string, lat: number, lng: number) =>
      apiFetch<{ ok: boolean }>('/api/worker/sos', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, latitude: lat, longitude: lng }),
      }),
    profile: () =>
      apiFetch<{ id: string; full_name: string; role: string; coop_shares: number; guild_category: string; is_available: boolean; is_verified: boolean }>('/api/worker/profile'),
  },

  jobs: {
    active: () =>
      apiFetch<Booking[]>('/api/jobs/active'),
    accept: (bookingId: string) =>
      apiFetch<Booking>(`/api/jobs/${bookingId}/accept`, { method: 'POST' }),
    decline: (bookingId: string) =>
      apiFetch<{ ok: boolean }>(`/api/jobs/${bookingId}/decline`, { method: 'POST' }),
    updateStatus: (bookingId: string, status: string) =>
      apiFetch<Booking>(`/api/jobs/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: status }),
      }),
    verifyOtp: (bookingId: string, otp: string) =>
      apiFetch<Booking>(`/api/jobs/${bookingId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
      }),
    history: () =>
      apiFetch<Booking[]>('/api/jobs/history'),
  },

  earnings: {
    summary: () =>
      apiFetch<{ total_earned: number; total_jobs: number; total_points: number; coop_shares: number; estimated_dividend: number; month: string }>('/api/earnings/summary'),
    ledger: () =>
      apiFetch<PatronageLedger[]>('/api/earnings/ledger'),
  },

  mutualAid: {
    list: () =>
      apiFetch<MutualAidClaim[]>('/api/mutual-aid'),
    create: (body: CreateMutualAidClaimInput) =>
      apiFetch<MutualAidClaim>('/api/mutual-aid', { method: 'POST', body: JSON.stringify(body) }),
    approvePeer: (claimId: string) =>
      apiFetch<{ ok: boolean }>(`/api/mutual-aid/${claimId}/approve`, { method: 'POST' }),
  },

  auth: {
    demo: () =>
      apiFetch<{ profile: { id: string; full_name: string; role: string } }>('/api/demo-login'),
  },
};
