-- ============================================================
--  Shram Sangam — Migration 005: Performance Indexes
-- ============================================================

-- profiles
CREATE INDEX idx_profiles_role         ON profiles (role);
CREATE INDEX idx_profiles_available    ON profiles (is_available) WHERE is_available = true;
CREATE INDEX idx_profiles_guild        ON profiles (guild_category);
CREATE INDEX idx_profiles_location     ON profiles USING GIST (location);

-- bookings
CREATE INDEX idx_bookings_customer     ON bookings (customer_id);
CREATE INDEX idx_bookings_worker       ON bookings (worker_id);
CREATE INDEX idx_bookings_service      ON bookings (service_id);
CREATE INDEX idx_bookings_status       ON bookings (status);
CREATE INDEX idx_bookings_created      ON bookings (created_at DESC);
-- Partial index for open requests (hot query path for dispatch)
CREATE INDEX idx_bookings_open_requests ON bookings (created_at DESC)
  WHERE status = 'requested' AND worker_id IS NULL;

-- patronage_ledger
CREATE INDEX idx_ledger_worker_month   ON patronage_ledger (worker_id, month);

-- payout_records
CREATE INDEX idx_payouts_worker        ON payout_records (worker_id);
CREATE INDEX idx_payouts_status        ON payout_records (status) WHERE status = 'queued';

-- proposals
CREATE INDEX idx_proposals_status      ON proposals (status);
CREATE INDEX idx_proposals_deadline    ON proposals (deadline) WHERE status = 'active';

-- votes
CREATE INDEX idx_votes_proposal        ON votes (proposal_id);
CREATE INDEX idx_votes_worker          ON votes (worker_id);

-- disputes
CREATE INDEX idx_disputes_booking      ON disputes (booking_id);
CREATE INDEX idx_disputes_status       ON disputes (status);

-- mutual_aid_claims
CREATE INDEX idx_claims_worker         ON mutual_aid_claims (worker_id);
CREATE INDEX idx_claims_status         ON mutual_aid_claims (status);
