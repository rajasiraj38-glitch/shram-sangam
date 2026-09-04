// services/automation-engine/src/db.ts
// Shared pg pool — one connection pool for the entire process

import { Pool } from 'pg';
import { config } from './config';

export const db = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/** Convenience: run a query with named context for logging */
export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  context = '',
): Promise<T[]> {
  try {
    const result = await db.query<T>(sql, params);
    return result.rows;
  } catch (err) {
    console.error(`[db${context ? ':' + context : ''}] Query error:`, (err as Error).message);
    throw err;
  }
}
