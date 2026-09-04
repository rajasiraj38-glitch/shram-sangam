// services/automation-engine/src/index.ts
// Main entry point — starts all automation workers on cron schedules.
//
// Schedule overview:
//  Every 30s  → dispatch loop (try to assign pending bookings)
//  Every 60s  → settlement worker (process queued payouts)
//  Every 5min → safety monitor (check worker heartbeats)
//  Every 5min → mutual aid cycle (disburse approved claims)
//  Nightly    → quorum checker (evaluate expired proposals)

import cron from 'node-cron';
import { db } from './db';
import { redis } from './redis';
import { runDispatchCycle } from './dispatch';
import { runSettlementCycle } from './settlement';
import { runQuorumCycle } from './quorum';
import { runMutualAidCycle } from './mutual-aid';
import { runSafetyMonitor } from './safety';

// ── Graceful shutdown ─────────────────────────────────────────────────────────

let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[engine] Received ${signal} — shutting down gracefully...`);
  await redis.quit();
  await db.end();
  console.log('[engine] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Safe wrapper — never let one cycle crash the whole process ────────────────

function safe(name: string, fn: () => Promise<void>): () => void {
  return async () => {
    if (isShuttingDown) return;
    try {
      await fn();
    } catch (err) {
      console.error(`[engine] ${name} cycle error:`, (err as Error).message);
    }
  };
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function start() {
  console.log('🚀 Shram Sangam — Automation Engine starting...');

  // Verify DB connectivity
  try {
    await db.query('SELECT 1');
    console.log('[engine] ✅ Database connected');
  } catch (err) {
    console.error('[engine] ❌ Database connection failed:', (err as Error).message);
    process.exit(1);
  }

  // Verify Redis connectivity
  try {
    await redis.connect();
    await redis.ping();
    console.log('[engine] ✅ Redis connected');
  } catch (err) {
    console.error('[engine] ❌ Redis connection failed:', (err as Error).message);
    process.exit(1);
  }

  // ── Cron schedule ─────────────────────────────────────────────────────────

  // Dispatch: every 30 seconds
  cron.schedule('*/30 * * * * *', safe('dispatch', runDispatchCycle));

  // Settlement: every 60 seconds
  cron.schedule('*/60 * * * * *', safe('settlement', runSettlementCycle));

  // Safety monitor: every 5 minutes
  cron.schedule('*/5 * * * *', safe('safety', runSafetyMonitor));

  // Mutual aid: every 5 minutes
  cron.schedule('*/5 * * * *', safe('mutual-aid', runMutualAidCycle));

  // Quorum checker: nightly at 00:05
  cron.schedule('5 0 * * *', safe('quorum', runQuorumCycle));

  console.log('[engine] ✅ All workers scheduled:');
  console.log('          • Dispatch      → every 30s');
  console.log('          • Settlement    → every 60s');
  console.log('          • Safety monitor → every 5min');
  console.log('          • Mutual aid    → every 5min');
  console.log('          • Quorum check  → nightly 00:05');

  // Run an immediate first cycle on startup
  await safe('dispatch',    runDispatchCycle)();
  await safe('settlement',  runSettlementCycle)();
  await safe('quorum',      runQuorumCycle)();

  console.log('[engine] 🟢 Ready');
}

start().catch((err) => {
  console.error('[engine] Fatal startup error:', err);
  process.exit(1);
});
