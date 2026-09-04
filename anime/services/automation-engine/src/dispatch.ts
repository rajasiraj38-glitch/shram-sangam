// services/automation-engine/src/dispatch.ts
// Equity-weighted dispatch loop.
//
// Algorithm:
//  1. Pull all 'requested' bookings with no worker from DB
//  2. For each, find eligible workers within radius using PostGIS
//  3. Score candidates: score = (1/distance_km) × (1 + equity_bonus)
//  4. Acquire a Redis lock (90s) and push the job offer via Supabase Realtime
//  5. If the worker accepts within 90s → booking moves to 'accepted' (handled by API)
//  6. If lock expires without acceptance → try next candidate

import { query, db } from './db';
import { redis, dispatchLockKey, dispatchQueueKey } from './redis';
import { notifyWorkerIncomingJob } from './realtime';
import { config } from './config';

// Mirrors computeEquityScore from shared-types/dispatch.ts
function equityScore(distanceKm: number, gigsCompleted: number, targetGigs = 20): number {
  const d = distanceKm <= 0 ? 0.01 : distanceKm;
  const bonus = 1 + Math.max(0, (targetGigs - gigsCompleted) / targetGigs);
  return parseFloat(((1 / d) * bonus).toFixed(4));
}

interface Candidate {
  worker_id: string;
  full_name: string;
  distance_km: number;
  gigs_this_period: number;
  score: number;
}

interface PendingBooking {
  id: string;
  service_title: string;
  category: string;
  address: string;
  total_amount: number;
  worker_payout: number;
  latitude: number | null;
  longitude: number | null;
  customer_name: string;
  guild_category: string;
}

async function findCandidates(booking: PendingBooking): Promise<Candidate[]> {
  if (!booking.latitude || !booking.longitude) {
    // No location — fall back to all available+verified workers in the right guild
    const rows = await query<Candidate & { distance_km: number }>(
      `SELECT p.id AS worker_id, p.full_name, 0.5 AS distance_km,
              COALESCE(gigs.cnt, 0) AS gigs_this_period
       FROM profiles p
       LEFT JOIN (
         SELECT worker_id, COUNT(*) AS cnt
         FROM bookings
         WHERE status = 'completed'
           AND created_at >= DATE_TRUNC('month', NOW())
         GROUP BY worker_id
       ) gigs ON gigs.worker_id = p.id
       WHERE p.role = 'worker_member'
         AND p.is_available = true
         AND p.is_verified = true
         AND (p.guild_category::text = $1 OR $1 = 'Other')
       ORDER BY RANDOM()
       LIMIT $2`,
      [booking.guild_category, config.dispatchMaxAttempts],
      'dispatch:fallback',
    );
    return rows.map((r) => ({
      ...r,
      score: equityScore(r.distance_km, Number(r.gigs_this_period)),
    }));
  }

  // PostGIS geo-radius query
  const rows = await query<{
    worker_id: string;
    full_name: string;
    distance_km: number;
    gigs_this_period: string;
  }>(
    `SELECT p.id AS worker_id,
            p.full_name,
            ST_Distance(
              p.location::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) / 1000 AS distance_km,
            COALESCE(gigs.cnt, 0) AS gigs_this_period
     FROM profiles p
     LEFT JOIN (
       SELECT worker_id, COUNT(*) AS cnt
       FROM bookings
       WHERE status = 'completed'
         AND created_at >= DATE_TRUNC('month', NOW())
       GROUP BY worker_id
     ) gigs ON gigs.worker_id = p.id
     WHERE p.role = 'worker_member'
       AND p.is_available = true
       AND p.is_verified = true
       AND (p.guild_category::text = $3 OR $3 = 'Other')
       AND ST_DWithin(
         p.location::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $4 * 1000
       )
     ORDER BY distance_km ASC
     LIMIT $5`,
    [
      booking.longitude,
      booking.latitude,
      booking.guild_category,
      config.dispatchRadiusKm,
      config.dispatchMaxAttempts * 3,
    ],
    'dispatch:geo',
  );

  return rows
    .map((r) => ({
      ...r,
      gigs_this_period: Number(r.gigs_this_period),
      score: equityScore(Number(r.distance_km), Number(r.gigs_this_period)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.dispatchMaxAttempts);
}

async function dispatchBooking(booking: PendingBooking): Promise<void> {
  const lockKey = dispatchLockKey(booking.id);

  // Check if this booking is already being dispatched
  const existing = await redis.get(lockKey);
  if (existing) return;

  const candidates = await findCandidates(booking);
  if (candidates.length === 0) {
    console.log(`[dispatch] No candidates for booking ${booking.id}`);
    return;
  }

  for (const candidate of candidates) {
    // Try to acquire lock — NX = only set if not exists, EX = TTL in seconds
    const acquired = await redis.set(lockKey, candidate.worker_id, 'NX', 'EX', config.dispatchLockSeconds);
    if (!acquired) {
      // Another instance already dispatched — skip
      break;
    }

    console.log(
      `[dispatch] Booking ${booking.id.slice(0, 8)} → Worker ${candidate.full_name} ` +
      `(score: ${candidate.score}, dist: ${Number(candidate.distance_km).toFixed(1)}km)`,
    );

    await notifyWorkerIncomingJob(candidate.worker_id, {
      type:              'INCOMING_JOB',
      booking_id:        booking.id,
      service_title:     booking.service_title,
      category:          booking.category,
      address:           booking.address,
      distance_km:       Number(candidate.distance_km),
      total_amount:      Number(booking.total_amount),
      worker_payout:     Number(booking.worker_payout),
      expires_in_seconds: config.dispatchLockSeconds,
      customer_name:     booking.customer_name,
    });

    // The lock will expire automatically after 90s.
    // If the worker accepts, the API routes call `releaseDispatchLock(bookingId)`.
    // We only attempt the first live candidate per run; the cron re-runs every 30s
    // to cascade to the next candidate when the lock expires without acceptance.
    break;
  }
}

export async function runDispatchCycle(): Promise<void> {
  // Find all unassigned requested bookings
  const pending = await query<PendingBooking>(
    `SELECT b.id, s.title AS service_title, s.category::text, b.address,
            b.total_amount, b.worker_payout,
            ST_Y(b.location::geometry) AS latitude,
            ST_X(b.location::geometry) AS longitude,
            p.full_name AS customer_name,
            s.category::text AS guild_category
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     JOIN profiles p ON p.id = b.customer_id
     WHERE b.status = 'requested'
       AND b.worker_id IS NULL
     ORDER BY b.created_at ASC`,
    [],
    'dispatch:pending',
  );

  if (pending.length > 0) {
    console.log(`[dispatch] Processing ${pending.length} pending booking(s)`);
  }

  await Promise.allSettled(pending.map(dispatchBooking));
}

/** Called by the booking API after a worker accepts — releases the lock */
export async function releaseDispatchLock(bookingId: string): Promise<void> {
  await redis.del(dispatchLockKey(bookingId));
  // Also remove from the sorted-set queue if present
  await redis.zrem(dispatchQueueKey, bookingId);
}
