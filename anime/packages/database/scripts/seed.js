// packages/database/scripts/seed.js
// Populates the database with realistic demo data for hackathon presentation

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // ── Profiles ──────────────────────────────────────────────────────────────
    console.log('🌱 Seeding profiles...');
    const { rows: profiles } = await client.query(`
      INSERT INTO profiles (full_name, role, phone, email, guild_category, is_available, is_verified, coop_shares, location)
      VALUES
        ('Ananya Sharma',   'customer',       '+919876543210', 'ananya@example.com',  NULL,              false, false, 1, ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)),
        ('Rohit Verma',     'customer',       '+919876543211', 'rohit@example.com',   NULL,              false, false, 1, ST_SetSRID(ST_MakePoint(77.2150, 28.6200), 4326)),
        ('Meena Kumari',    'customer',       '+919876543212', 'meena@example.com',   NULL,              false, false, 1, ST_SetSRID(ST_MakePoint(77.2050, 28.6100), 4326)),
        ('Suresh Plumber',  'worker_member',  '+919876543213', 'suresh@example.com',  'Plumbing',        true,  true,  5, ST_SetSRID(ST_MakePoint(77.2100, 28.6150), 4326)),
        ('Ramesh Electric', 'worker_member',  '+919876543214', 'ramesh@example.com',  'Electrical',      true,  true,  4, ST_SetSRID(ST_MakePoint(77.2200, 28.6250), 4326)),
        ('Priya Caregiver', 'worker_member',  '+919876543215', 'priya@example.com',   'Caregiving',      true,  true,  6, ST_SetSRID(ST_MakePoint(77.2080, 28.6120), 4326)),
        ('Deepak Carpenter','worker_member',  '+919876543216', 'deepak@example.com',  'Carpentry',       false, true,  3, ST_SetSRID(ST_MakePoint(77.2300, 28.6300), 4326)),
        ('Kavita Cleaner',  'worker_member',  '+919876543217', 'kavita@example.com',  'Cleaning',        true,  true,  7, ST_SetSRID(ST_MakePoint(77.2060, 28.6110), 4326)),
        ('Arun Painter',    'worker_member',  '+919876543218', 'arun@example.com',    'Painting',        true,  true,  2, ST_SetSRID(ST_MakePoint(77.2170, 28.6180), 4326)),
        ('Admin Coop',      'admin_coop',     '+919876540000', 'admin@shramsangam.in',NULL,              false, true,  10, ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326))
      ON CONFLICT DO NOTHING
      RETURNING id, full_name, role
    `);
    console.log(`   → ${profiles.length} profiles seeded`);

    // Map names to IDs for FK use
    const byName = Object.fromEntries(profiles.map((p) => [p.full_name, p.id]));

    // Update vouched_by for workers (peer endorsements)
    if (byName['Suresh Plumber'] && byName['Ramesh Electric'] && byName['Priya Caregiver']) {
      await client.query(`
        UPDATE profiles SET vouched_by = ARRAY[$1::uuid, $2::uuid]
        WHERE id = $3
      `, [byName['Ramesh Electric'], byName['Priya Caregiver'], byName['Suresh Plumber']]);
    }

    // ── Services ──────────────────────────────────────────────────────────────
    console.log('🌱 Seeding services...');
    const { rows: services } = await client.query(`
      INSERT INTO services (title, category, description, base_rate, unit, min_hours, icon_name)
      VALUES
        ('Emergency Pipe Repair',         'Plumbing',         'Burst pipes, leaks, drain unclogging',              600, 'hour', 1,   'wrench'),
        ('Bathroom Fitting & Fixture',    'Plumbing',         'Install taps, shower heads, flush tanks',           500, 'visit', 1,  'droplets'),
        ('Ceiling Fan & Wiring Repair',   'Electrical',       'Fan installation, switch repair, rewiring',         400, 'hour', 1,   'zap'),
        ('MCB & Switchboard Repair',      'Electrical',       'Fuse box, circuit breaker, switchboard issues',     450, 'visit', 1,  'plug'),
        ('Elder Companion & Grocery Run', 'Caregiving',       'Daily companion, medication reminders, errands',    350, 'hour', 2,   'heart'),
        ('Post-Surgery Home Care',        'Caregiving',       'Wound dressing, mobility assistance, meals',        500, 'hour', 4,   'activity'),
        ('Full Home Deep Cleaning',       'Cleaning',         '2BHK/3BHK deep clean, appliances, bathrooms',       800, 'job',  1,   'sparkles'),
        ('Kitchen & Bathroom Cleaning',   'Cleaning',         'Tiles, grout, chimney, exhaust fan',                500, 'visit', 1,  'home'),
        ('Custom Furniture Repair',       'Carpentry',        'Chair joints, door hinges, cabinet fixes',          400, 'hour', 1,   'hammer'),
        ('Wardrobe & Shelf Installation', 'Carpentry',        'Wall-mount shelves, wardrobe sliding doors',        550, 'visit', 2,  'layers'),
        ('Interior Wall Painting',        'Painting',         'Per room painting with primer, 2 coats',            700, 'job',  1,   'paintbrush'),
        ('Appliance Service & Repair',    'Appliance Repair', 'AC service, washing machine, refrigerator',        600, 'visit', 1,  'settings')
      ON CONFLICT DO NOTHING
      RETURNING id, title
    `);
    console.log(`   → ${services.length} services seeded`);

    const svcByTitle = Object.fromEntries(services.map((s) => [s.title, s.id]));

    // ── Bookings ──────────────────────────────────────────────────────────────
    console.log('🌱 Seeding bookings...');
    const customerId1 = byName['Ananya Sharma'];
    const customerId2 = byName['Rohit Verma'];
    const workerId1   = byName['Suresh Plumber'];
    const workerId2   = byName['Ramesh Electric'];
    const workerId3   = byName['Priya Caregiver'];
    const svcId1      = svcByTitle['Emergency Pipe Repair'];
    const svcId2      = svcByTitle['Ceiling Fan & Wiring Repair'];
    const svcId3      = svcByTitle['Elder Companion & Grocery Run'];

    if (customerId1 && workerId1 && svcId1) {
      await client.query(`
        INSERT INTO bookings
          (customer_id, worker_id, service_id, status, total_amount, worker_payout,
           coop_reserve_fee, mutual_aid_contribution, address, completed_at)
        VALUES
          ($1, $2, $3, 'completed', 1200, 1080, 84, 36,
           '12 MG Road, Connaught Place, New Delhi - 110001', NOW() - INTERVAL '2 days')
        ON CONFLICT DO NOTHING
      `, [customerId1, workerId1, svcId1]);
    }

    if (customerId2 && workerId2 && svcId2) {
      await client.query(`
        INSERT INTO bookings
          (customer_id, worker_id, service_id, status, total_amount, worker_payout,
           coop_reserve_fee, mutual_aid_contribution, address)
        VALUES
          ($1, $2, $3, 'accepted', 800, 720, 56, 24,
           '45 Lajpat Nagar, South Delhi - 110024')
        ON CONFLICT DO NOTHING
      `, [customerId2, workerId2, svcId2]);
    }

    if (customerId1 && svcId3) {
      await client.query(`
        INSERT INTO bookings
          (customer_id, service_id, status, total_amount, worker_payout,
           coop_reserve_fee, mutual_aid_contribution, address)
        VALUES
          ($1, $2, 'requested', 700, 630, 49, 21,
           '8 Vasant Kunj, South West Delhi - 110070')
        ON CONFLICT DO NOTHING
      `, [customerId1, svcId3]);
    }
    console.log('   → 3 bookings seeded (1 completed, 1 accepted, 1 requested)');

    // ── Coop Financials (update singleton) ────────────────────────────────────
    console.log('🌱 Updating coop financials...');
    await client.query(`
      UPDATE coop_financials SET
        operational_reserve        = 4820,
        mutual_aid_reserve         = 2065,
        total_disbursed_to_workers = 87300,
        total_gigs_completed       = 97
    `);
    console.log('   → Coop financials updated');

    // ── Proposals ─────────────────────────────────────────────────────────────
    console.log('🌱 Seeding governance proposals...');
    const proposerId = byName['Suresh Plumber'];

    let proposalId1, proposalId2;
    if (proposerId) {
      const { rows: props } = await client.query(`
        INSERT INTO proposals (title, description, category, status, proposed_by, deadline, votes_yes, votes_no, votes_abstain, total_eligible_voters)
        VALUES
          (
            'Allocate ₹5,000 from Mutual Aid for Tool Replacement Grants',
            'Many members have reported tool wear and breakage during complex jobs. This proposal allocates ₹5,000 from the mutual aid reserve to a monthly tool replacement grant. Workers who have completed ≥10 gigs in the past 3 months can apply. This ensures our members can always deliver quality service without financial stress.',
            'Fund Allocation', 'active', $1,
            NOW() + INTERVAL '5 days', 12, 3, 1, 20
          ),
          (
            'Reduce Platform Operating Fee from 7% to 5%',
            'Our Q3 operational surplus exceeds projections by ₹18,000. This proposal reduces the platform fee from 7% to 5%, increasing worker take-home from 90% to 92%. The reduced fee is financially sustainable given current reserve levels, and it directly improves member income for all 97 completed bookings per month.',
            'Fee Adjustment', 'active', $1,
            NOW() + INTERVAL '7 days', 8, 5, 2, 20
          )
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [proposerId]);
      proposalId1 = props[0]?.id;
      proposalId2 = props[1]?.id;
    }
    console.log('   → 2 active proposals seeded');

    // ── Votes ─────────────────────────────────────────────────────────────────
    if (proposalId1 && workerId1 && workerId2) {
      await client.query(`
        INSERT INTO votes (proposal_id, worker_id, decision)
        VALUES ($1, $2, 'yes'), ($1, $3, 'yes')
        ON CONFLICT DO NOTHING
      `, [proposalId1, workerId1, workerId2]);
      console.log('   → Sample votes seeded');
    }

    // ── Patronage Ledger ──────────────────────────────────────────────────────
    if (workerId1) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      await client.query(`
        INSERT INTO patronage_ledger (worker_id, booking_id, amount_earned, points_accrued, month)
        SELECT $1, b.id, b.worker_payout, FLOOR(b.worker_payout / 10)::int, $2
        FROM bookings b
        WHERE b.worker_id = $1 AND b.status = 'completed'
        ON CONFLICT DO NOTHING
      `, [workerId1, thisMonth]);
      console.log('   → Patronage ledger entries seeded');
    }

    console.log('\n✅ Seed complete — demo data ready for presentation');
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
