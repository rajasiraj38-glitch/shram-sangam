// services/automation-engine/src/config.ts
import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  databaseUrl:          required('DATABASE_URL'),
  redisUrl:             optional('REDIS_URL', 'redis://localhost:6379'),

  // Razorpay — use test keys for hackathon
  razorpayKeyId:        optional('RAZORPAY_KEY_ID', ''),
  razorpayKeySecret:    optional('RAZORPAY_KEY_SECRET', ''),

  // Supabase realtime REST for broadcasting to clients
  supabaseUrl:          optional('NEXT_PUBLIC_SUPABASE_URL', ''),
  supabaseServiceKey:   optional('SUPABASE_SERVICE_ROLE_KEY', ''),

  // Dispatch settings
  dispatchRadiusKm:     parseFloat(optional('DISPATCH_RADIUS_KM', '5')),
  dispatchLockSeconds:  parseInt(optional('DISPATCH_LOCK_SECONDS', '90'), 10),
  dispatchMaxAttempts:  parseInt(optional('DISPATCH_MAX_ATTEMPTS', '5'), 10),

  // Safety check-in interval (minutes while job is in_progress)
  safetyCheckinMinutes: parseInt(optional('SAFETY_CHECKIN_MINUTES', '60'), 10),

  // Patronage: 1 point per ₹10 earned
  pointsPerRupee:       parseFloat(optional('POINTS_PER_RUPEE', '0.1')),
  // Shares: 1 share per 50 patronage points
  sharesPerPoints:      parseInt(optional('SHARES_PER_POINTS', '50'), 10),
} as const;
