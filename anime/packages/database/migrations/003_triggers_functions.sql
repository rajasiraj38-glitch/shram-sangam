-- ============================================================
--  Shram Sangam — Migration 003: Triggers & Automation Functions
-- ============================================================

-- ─── updated_at auto-stamp ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Booking Status Transition Guard ────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_booking_transition()
RETURNS TRIGGER AS $$
DECLARE
  allowed TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Define allowed transitions
  CASE OLD.status
    WHEN 'requested'  THEN allowed := ARRAY['accepted', 'cancelled'];
    WHEN 'accepted'   THEN allowed := ARRAY['arrived', 'cancelled'];
    WHEN 'arrived'    THEN allowed := ARRAY['in_progress'];
    WHEN 'in_progress' THEN allowed := ARRAY['completed', 'disputed'];
    ELSE allowed := ARRAY[]::TEXT[];  -- terminal states: no transitions
  END CASE;

  IF NEW.status != OLD.status AND NOT (NEW.status::TEXT = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid booking status transition: % → %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_state_machine
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_transition();

-- ─── Autonomous Settlement on Completion ─────────────────────────────────────
-- Fires when booking.status transitions to 'completed'.
-- Atomically:
--   1. Routes 7% to operational_reserve
--   2. Routes 3% to mutual_aid_reserve
--   3. Adds patronage points to worker (1 pt per ₹10 earned)
--   4. Increments cooperative gig counter
--   5. Queues payout record for worker

CREATE OR REPLACE FUNCTION autonomous_settlement()
RETURNS TRIGGER AS $$
DECLARE
  current_month CHAR(7) := TO_CHAR(NOW(), 'YYYY-MM');
  points        INT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- 1 & 2: Update cooperative financial pools
    UPDATE coop_financials SET
      operational_reserve        = operational_reserve + NEW.coop_reserve_fee,
      mutual_aid_reserve         = mutual_aid_reserve + NEW.mutual_aid_contribution,
      total_disbursed_to_workers = total_disbursed_to_workers + NEW.worker_payout,
      total_gigs_completed       = total_gigs_completed + 1,
      updated_at                 = NOW();

    -- 3: Compute and credit patronage points (1 pt per ₹10 earned)
    points := FLOOR(NEW.worker_payout / 10);

    INSERT INTO patronage_ledger
      (worker_id, booking_id, amount_earned, points_accrued, month)
    VALUES
      (NEW.worker_id, NEW.id, NEW.worker_payout, points, current_month);

    -- 4: Increment worker coop_shares (1 share per 50 pts — long term ownership)
    UPDATE profiles
    SET coop_shares = coop_shares + FLOOR(points / 50)
    WHERE id = NEW.worker_id AND FLOOR(points / 50) > 0;

    -- 5: Queue worker payout record
    INSERT INTO payout_records
      (worker_id, booking_id, amount, payout_type, status)
    VALUES
      (NEW.worker_id, NEW.id, NEW.worker_payout, 'job_earnings', 'queued');

    -- 6: Record completion timestamp
    NEW.completed_at = NOW();

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_autonomous_settlement
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION autonomous_settlement();

-- ─── Vote Tally Auto-Update ───────────────────────────────────────────────────
-- Keep proposals.votes_yes/no/abstain in sync on each ballot insert.

CREATE OR REPLACE FUNCTION update_vote_tally()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.decision = 'yes' THEN
    UPDATE proposals SET votes_yes = votes_yes + 1 WHERE id = NEW.proposal_id;
  ELSIF NEW.decision = 'no' THEN
    UPDATE proposals SET votes_no = votes_no + 1 WHERE id = NEW.proposal_id;
  ELSE
    UPDATE proposals SET votes_abstain = votes_abstain + 1 WHERE id = NEW.proposal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vote_tally
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_tally();

-- ─── Completion OTP Generator ────────────────────────────────────────────────
-- Auto-generates a 6-digit OTP when booking moves to 'in_progress'

CREATE OR REPLACE FUNCTION generate_completion_otp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status = 'arrived' THEN
    NEW.completion_otp = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_otp
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_completion_otp();

-- ─── Geo-Radius Worker Lookup Function ───────────────────────────────────────
-- Returns worker profiles within `radius_km` of a given lat/lng,
-- filtered by category and availability.

CREATE OR REPLACE FUNCTION find_nearby_workers(
  lat          FLOAT,
  lng          FLOAT,
  radius_km    FLOAT DEFAULT 5.0,
  category     service_category DEFAULT NULL
)
RETURNS TABLE (
  worker_id   UUID,
  full_name   TEXT,
  distance_km FLOAT,
  guild_category service_category,
  coop_shares INT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    ROUND((ST_Distance(
      p.location::GEOGRAPHY,
      ST_MakePoint(lng, lat)::GEOGRAPHY
    ) / 1000.0)::NUMERIC, 2)::FLOAT AS distance_km,
    p.guild_category,
    p.coop_shares,
    p.is_verified
  FROM profiles p
  WHERE
    p.role = 'worker_member'
    AND p.is_available = true
    AND p.is_verified = true
    AND p.location IS NOT NULL
    AND ST_DWithin(
      p.location::GEOGRAPHY,
      ST_MakePoint(lng, lat)::GEOGRAPHY,
      radius_km * 1000  -- convert km to metres
    )
    AND (category IS NULL OR p.guild_category = category)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
