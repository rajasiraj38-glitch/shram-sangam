// packages/database/scripts/migrate.js
// Runs all SQL migration files in order against the database

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id        SERIAL PRIMARY KEY,
        filename  TEXT NOT NULL UNIQUE,
        run_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Get list of already-run migrations
    const { rows: ran } = await client.query(
      'SELECT filename FROM _migrations ORDER BY filename'
    );
    const ranSet = new Set(ran.map((r) => r.filename));

    // Read and sort migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let applied = 0;
    for (const file of files) {
      if (ranSet.has(file)) {
        console.log(`⏭  Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`🔄 Applying ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}`);
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed on ${file}:`, err.message);
        process.exit(1);
      }
    }

    if (applied === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`\n✅ Migration complete — ${applied} file(s) applied`);
    }
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
