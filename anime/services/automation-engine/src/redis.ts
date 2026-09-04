// services/automation-engine/src/redis.ts
// Redis client — used for dispatch queue and lock keys

import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect',  () => console.log('[redis] Connected'));
redis.on('error',   (err) => console.error('[redis] Error:', err.message));
redis.on('reconnecting', () => console.log('[redis] Reconnecting...'));

// ── Key helpers ───────────────────────────────────────────────────────────────

/** Lock key: prevents double-dispatch while a worker has exclusive 90s window */
export const dispatchLockKey  = (bookingId: string) => `dispatch:lock:${bookingId}`;

/** Queue key: sorted set of pending booking IDs ordered by created_at */
export const dispatchQueueKey = 'dispatch:queue';

/** Safety heartbeat key: set when worker last checked in */
export const safetyKey        = (bookingId: string) => `safety:checkin:${bookingId}`;

/** Payout retry counter */
export const payoutRetryKey   = (payoutId: string) => `payout:retry:${payoutId}`;
