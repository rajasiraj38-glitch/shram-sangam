-- ============================================================
--  Shram Sangam — Seed 002: Profiles, Bookings & Patronage
--  Realistic demo data for hackathon presentation
-- ============================================================

-- ─── Customers ───────────────────────────────────────────────────────────────

INSERT INTO profiles (id, full_name, role, phone, email, language_preference, is_verified) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'Priya Mehra',
  'customer', '+919876543201', 'priya.mehra@example.com', 'hi', true
),
(
  'c0000000-0000-0000-0000-000000000002',
  'Arjun Sharma',
  'customer', '+919876543202', 'arjun.sharma@example.com', 'hi', true
),
(
  'c0000000-0000-0000-0000-000000000003',
  'Sunita Rao',
  'customer', '+919876543203', 'sunita.rao@example.com', 'kn', true
);

-- ─── Worker-Members (Verified Co-op Members) ─────────────────────────────────

INSERT INTO profiles (
  id, full_name, role, phone, email, language_preference,
  guild_category, is_verified, is_available, coop_shares,
  location
) VALUES
(
  'w0000000-0000-0000-0000-000000000001',
  'Rajan Kumar',
  'worker_member', '+919876543101', 'rajan.kumar@example.com', 'hi',
  'Plumbing', true, true, 12,
  ST_MakePoint(77.5946, 12.9716)   -- Bengaluru central
),
(
  'w0000000-0000-0000-0000-000000000002',
  'Suresh Babu',
  'worker_member', '+919876543102', 'suresh.babu@example.com', 'kn',
  'Electrical', true, true, 8,
  ST_MakePoint(77.6033, 12.9778)
),
(
  'w0000000-0000-0000-0000-000000000003',
  'Meena Devi',
  'worker_member', '+919876543103', 'meena.devi@example.com', 'hi',
  'Caregiving', true, false, 15,
  ST_MakePoint(77.5800, 12.9650)
),
(
  'w0000000-0000-0000-0000-000000000004',
  'Govind Yadav',
  'worker_member', '+919876543104', 'govind.yadav@example.com', 'hi',
  'Plumbing', true, true, 5,
  ST_MakePoint(77.6100, 12.9600)
),
(
  'w0000000-0000-0000-0000-000000000005',
  'Anitha S.',
  'worker_member', '+919876543105', 'anitha.s@example.com', 'ta',
  'Cleaning', true, true, 9,
  ST_MakePoint(77.5850, 12.9750)
),
(
  'w0000000-0000-0000-0000-000000000006',
  'Vikram Nair',
  'worker_member', '+919876543106', 'vikram.nair@example.com', 'ml',
  'Electrical', true, true, 6,
  ST_MakePoint(77.5920, 12.9690)
),
(
  'w0000000-0000-0000-0000-000000000007',
  'Fatima Begum',
  'worker_member', '+919876543107', 'fatima.begum@example.com', 'ur',
  'Caregiving', true, true, 11,
  ST_MakePoint(77.5990, 12.9810)
);

-- ─── Admin ────────────────────────────────────────────────────────────────────

INSERT INTO profiles (id, full_name, role, phone, email, language_preference, is_verified) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Shram Sangam Admin',
  'admin_coop', '+919000000001', 'admin@shramsangam.coop', 'en', true
);

-- ─── Completed Bookings (for demo history) ───────────────────────────────────

INSERT INTO bookings (
  id, customer_id, worker_id, service_id, status,
  total_amount, worker_payout, coop_reserve_fee, mutual_aid_contribution,
  address, completed_at, created_at, updated_at
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'w0000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'completed',
  1200.00, 1080.00, 84.00, 36.00,
  '14/3 Indiranagar, Bengaluru, Karnataka 560038',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days 2 hours',
  NOW() - INTERVAL '2 days'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000002',
  'w0000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'completed',
  800.00, 720.00, 56.00, 24.00,
  '22 Koramangala 5th Block, Bengaluru 560095',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days 3 hours',
  NOW() - INTERVAL '5 days'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000003',
  'w0000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000005',
  'completed',
  700.00, 630.00, 49.00, 21.00,
  '8 Jayanagar 4th T Block, Bengaluru 560041',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day 3 hours',
  NOW() - INTERVAL '1 day'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'w0000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000007',
  'completed',
  800.00, 720.00, 56.00, 24.00,
  '14/3 Indiranagar, Bengaluru, Karnataka 560038',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days 4 hours',
  NOW() - INTERVAL '10 days'
);

-- Active booking (in_progress — for live demo)
INSERT INTO bookings (
  id, customer_id, worker_id, service_id, status,
  total_amount, worker_payout, coop_reserve_fee, mutual_aid_contribution,
  address, completion_otp, created_at, updated_at
) VALUES
(
  'b0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000002',
  'w0000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000004',
  'in_progress',
  1100.00, 990.00, 77.00, 33.00,
  '55 HSR Layout Sector 2, Bengaluru 560102',
  '847291',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '30 minutes'
);

-- Open request (for dispatch demo)
INSERT INTO bookings (
  id, customer_id, service_id, status,
  total_amount, worker_payout, coop_reserve_fee, mutual_aid_contribution,
  address, notes, created_at, updated_at
) VALUES
(
  'b0000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000001',
  'requested',
  600.00, 540.00, 42.00, 18.00,
  '3 Sadashivanagar, Bengaluru 560080',
  'Kitchen sink overflowing, water on floor, urgent help needed.',
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '5 minutes'
);

-- ─── Seed patronage ledger for completed bookings ────────────────────────────

INSERT INTO patronage_ledger (worker_id, booking_id, amount_earned, points_accrued, month)
VALUES
('w0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1080.00, 108, TO_CHAR(NOW() - INTERVAL '2 days', 'YYYY-MM')),
('w0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',  720.00,  72, TO_CHAR(NOW() - INTERVAL '5 days', 'YYYY-MM')),
('w0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',  630.00,  63, TO_CHAR(NOW() - INTERVAL '1 day',  'YYYY-MM')),
('w0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004',  720.00,  72, TO_CHAR(NOW() - INTERVAL '10 days', 'YYYY-MM'));

-- ─── Seed cooperative financials ─────────────────────────────────────────────

UPDATE coop_financials SET
  operational_reserve        = 245.00,   -- 7% from completed bookings
  mutual_aid_reserve         = 105.00,   -- 3% from completed bookings
  total_disbursed_to_workers = 3150.00,
  total_gigs_completed       = 4;
