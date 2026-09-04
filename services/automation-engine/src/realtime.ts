// services/automation-engine/src/realtime.ts
// Broadcasts events to frontend apps via Supabase Realtime REST broadcast.
// Falls back to a no-op log when Supabase is not configured (local dev).

import axios from 'axios';
import { config } from './config';

interface BroadcastPayload {
  type: string;
  [key: string]: unknown;
}

/**
 * Broadcast a message to a Supabase Realtime channel.
 * channel: e.g. "worker:<worker_id>" or "booking:<booking_id>"
 */
export async function broadcast(channel: string, payload: BroadcastPayload): Promise<void> {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.log(`[realtime] (no-op) → ${channel}:`, JSON.stringify(payload));
    return;
  }

  try {
    await axios.post(
      `${config.supabaseUrl}/realtime/v1/api/broadcast`,
      { messages: [{ topic: channel, event: payload.type, payload }] },
      {
        headers: {
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5_000,
      },
    );
  } catch (err) {
    // Non-fatal: realtime failure shouldn't break the dispatch loop
    console.warn(`[realtime] Broadcast failed on ${channel}:`, (err as Error).message);
  }
}

/** Notify a specific worker of an incoming job offer */
export function notifyWorkerIncomingJob(workerId: string, payload: BroadcastPayload) {
  return broadcast(`worker:${workerId}`, payload);
}

/** Notify both customer and worker of a booking status change */
export function notifyBookingUpdate(bookingId: string, payload: BroadcastPayload) {
  return broadcast(`booking:${bookingId}`, payload);
}
