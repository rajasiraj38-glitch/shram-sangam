// packages/database/scripts/reset.js
// Drops all tables and re-runs migrations + seed.
// USE WITH CAUTION — destroys all data. Safe for local dev / hackathon demo resets.

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function reset() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('⚠️  Resetting database...');

    // Drop all tables in reverse dependency order
    await client.query(`
      DROP TABLE IF EXISTS
        votes, proposals,
        mutual_aid_claims, disputes,
        payout_records, patronage_ledger,
        bookings, services,
        coop_financials, profiles,
        _migrations
      CASCADE;
    `);

    // Drop custom types
    await client.query(`
      DROP TYPE IF EXISTS
        user_role, booking_status, service_unit, service_category,
        payout_status, payout_type, proposal_status, proposal_category,
        dispute_status, claim_status
      CASCADE;
    `);

    console.log('🗑  All tables dropped');
    await client.end();

    // Re-run migrate then seed
    console.log('\n▶️  Running migrations...');
    require('./migrate');
  } catch (err) {
    console.error('Reset failed:', err.message);
    await client.end();
    process.exit(1);
  }
}

reset();
