// src/lib/api.ts
// Typed fetch helpers for all API routes used by customer-app

import type { Service, Booking, CreateBookingInput } from '@shram-sangam/shared-types';
import type { AIScopeEstimate } from '@shram-sangam/shared-types';
import type { ApiResponse } from '@shram-sangam/shared-types';

const BASE = '';  // Next.js API routes — same origin

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error((json as { error: string }).error ?? 'Request failed');
  return (json as { success: true; data: T }).data;
}

export const api = {
  services: {
    list: (category?: string) =>
      apiFetch<Service[]>(`/api/services${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  },

  bookings: {
    create: (body: CreateBookingInput) =>
      apiFetch<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),

    list: () =>
      apiFetch<Booking[]>('/api/bookings'),

    get: (id: string) =>
      apiFetch<Booking>(`/api/bookings/${id}`),

    updateStatus: (id: string, newStatus: string, otp?: string) =>
      apiFetch<Booking>(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ new_status: newStatus, completion_otp: otp }),
      }),

    fileDispute: (id: string, reason: string) =>
      apiFetch<Booking>(`/api/bookings/${id}/dispute`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  scope: {
    estimate: (description: string, imageBase64?: string, category?: string) =>
      apiFetch<AIScopeEstimate>('/api/scope', {
        method: 'POST',
        body: JSON.stringify({ description, image_base64: imageBase64, service_category: category }),
      }),
  },

  auth: {
    demo: (role: 'customer' | 'worker_member') =>
      apiFetch<{ profile: { id: string; full_name: string; role: string } }>(
        `/api/demo-login?role=${role}`,
      ),
  },
};
