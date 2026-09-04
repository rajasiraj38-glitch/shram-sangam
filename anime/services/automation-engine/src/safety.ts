// services/automation-engine/src/safety.ts
// Worker safety monitor.
//
// While a booking is 'in_progress', the worker is expected to check in
// every N minutes (default 60). If a check-in is missed, the system:
//  1. Sends an alert notification to the worker
//  2. After a second miss, alerts nearby co-op members and emergency contacts

import { query } from './db';
import { redis, safetyKey } from './redis';
import { broadcast } from './realtime';
import { config } from './config';

interface ActiveJob {
  booking_id: string;
  worker_id: string;
  worker_name: string;
  worker_phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

const CHECKIN_WINDOW_SECONDS = config.safetyCheckinMinutes * 60;
const ESCALATION_MULTIPLIER  = 2; // Escalate after 2× window without response

export async function runSafetyMonitor(): Promise<void> {
  const activeJobs = await query<ActiveJob>(
    `SELECT b.id AS booking_id, b.worker_id,
            p.full_name AS worker_name, p.phone AS worker_phone,
            b.address,
            ST_Y(b.location::geometry) AS latitude,
            ST_X(b.location::geometry) AS longitude
     FROM bookings b
     JOIN profiles p ON p.id = b.worker_id
     WHERE b.status = 'in_progress'`,
    [],
    'safety:fetch',
  );

  for (const job of activeJobs) {
    const key    = safetyKey(job.booking_id);
    const lastTs = await redis.get(key);

    if (!lastTs) {
      // First time we see this job in-progress — start the clock
      await redis.set(key, String(Date.now()), 'EX', CHECKIN_WINDOW_SECONDS * ESCALATION_MULTIPLIER + 60);
      continue;
    }

    const elapsedSeconds = (Date.now() - parseInt(lastTs, 10)) / 1000;

    if (elapsedSeconds > CHECKIN_WINDOW_SECONDS * ESCALATION_MULTIPLIER) {
      // Missed TWO windows — escalate to nearby co-op members
      console.warn(
        `[safety] ESCALATION — worker ${job.worker_name} (booking ${job.booking_id.slice(0, 8)}) ` +
        `missed check-in for ${Math.round(elapsedSeconds / 60)} min`,
      );
      await broadcast(`safety:alerts`, {
        type:       'SAFETY_ESCALATION',
        booking_id: job.booking_id,
        worker_id:  job.worker_id,
        worker_name: job.worker_name,
        address:    job.address,
        latitude:   job.latitude,
        longitude:  job.longitude,
        message:    `⚠️ ${job.worker_name} has not checked in for over ${Math.round(elapsedSeconds / 60)} minutes at: ${job.address}`,
        timestamp:  new Date().toISOString(),
      });
    } else if (elapsedSeconds > CHECKIN_WINDOW_SECONDS) {
      // Missed ONE window — nudge the worker
      console.log(
        `[safety] Check-in overdue for worker ${job.worker_name} — sending reminder`,
      );
      await broadcast(`worker:${job.worker_id}`, {
        type:       'SAFETY_CHECKIN_REQUIRED',
        booking_id: job.booking_id,
        worker_id:  job.worker_id,
        next_checkin_at: new Date(Date.now() + CHECKIN_WINDOW_SECONDS * 1000).toISOString(),
        message:    'Please tap to confirm you are safe. Your co-op members care about you.',
      });
    }
  }
}

/** Called when a worker confirms safety check-in via the app */
export async function recordSafetyCheckin(bookingId: string): Promise<void> {
  const key = safetyKey(bookingId);
  await redis.set(key, String(Date.now()), 'EX', CHECKIN_WINDOW_SECONDS * ESCALATION_MULTIPLIER + 60);
  console.log(`[safety] Check-in recorded for booking ${bookingId.slice(0, 8)}`);
}
