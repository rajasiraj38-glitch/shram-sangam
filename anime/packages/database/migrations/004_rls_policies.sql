-- ============================================================
--  Shram Sangam — Migration 004: Row-Level Security (RLS)
--  Enforces data isolation at the database layer.
--  Works with Supabase Auth (auth.uid()) or a custom JWT claim.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE coop_financials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patronage_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutual_aid_claims  ENABLE ROW LEVEL SECURITY;

-- ─── Helper: current user role ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ────────────────────────────────────────────────────────────────

-- Anyone can read public worker profiles
CREATE POLICY profiles_read_all ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Only admins can insert new profiles directly (normally via trigger)
CREATE POLICY profiles_insert_admin ON profiles
  FOR INSERT WITH CHECK (current_user_role() = 'admin_coop');

-- ─── services ────────────────────────────────────────────────────────────────

-- All authenticated users can read active services
CREATE POLICY services_read_active ON services
  FOR SELECT USING (is_active = true);

-- Only admins can manage services
CREATE POLICY services_manage_admin ON services
  FOR ALL USING (current_user_role() = 'admin_coop');

-- ─── bookings ────────────────────────────────────────────────────────────────

-- Customers see their own bookings
CREATE POLICY bookings_customer_read ON bookings
  FOR SELECT USING (customer_id = auth.uid());

-- Workers see bookings assigned to them OR open requests near them (requested, no worker)
CREATE POLICY bookings_worker_read ON bookings
  FOR SELECT USING (
    worker_id = auth.uid()
    OR (status = 'requested' AND worker_id IS NULL AND current_user_role() = 'worker_member')
  );

-- Admins see everything
CREATE POLICY bookings_admin_read ON bookings
  FOR SELECT USING (current_user_role() = 'admin_coop');

-- Customers can create bookings for themselves only
CREATE POLICY bookings_customer_insert ON bookings
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    AND current_user_role() = 'customer'
  );

-- Workers can update bookings assigned to them (status transitions)
CREATE POLICY bookings_worker_update ON bookings
  FOR UPDATE USING (
    worker_id = auth.uid()
    AND current_user_role() = 'worker_member'
  );

-- Customers can cancel their own requested bookings
CREATE POLICY bookings_customer_cancel ON bookings
  FOR UPDATE USING (
    customer_id = auth.uid()
    AND status = 'requested'
  );

-- ─── coop_financials ─────────────────────────────────────────────────────────

-- All worker_members and admins can view (public transparency is core to coop)
CREATE POLICY financials_read_members ON coop_financials
  FOR SELECT USING (
    current_user_role() IN ('worker_member', 'admin_coop')
  );

-- Only system (service role) can update via triggers
CREATE POLICY financials_system_update ON coop_financials
  FOR UPDATE USING (current_user_role() = 'admin_coop');

-- ─── patronage_ledger ────────────────────────────────────────────────────────

-- Workers see their own ledger entries
CREATE POLICY ledger_worker_read ON patronage_ledger
  FOR SELECT USING (worker_id = auth.uid());

-- Admins see all
CREATE POLICY ledger_admin_read ON patronage_ledger
  FOR SELECT USING (current_user_role() = 'admin_coop');

-- ─── payout_records ──────────────────────────────────────────────────────────

CREATE POLICY payouts_worker_read ON payout_records
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY payouts_admin_read ON payout_records
  FOR SELECT USING (current_user_role() = 'admin_coop');

-- ─── proposals ───────────────────────────────────────────────────────────────

-- All worker members can read proposals (democratic transparency)
CREATE POLICY proposals_read_members ON proposals
  FOR SELECT USING (
    current_user_role() IN ('worker_member', 'admin_coop')
  );

-- Worker members can create proposals
CREATE POLICY proposals_create_workers ON proposals
  FOR INSERT WITH CHECK (
    proposed_by = auth.uid()
    AND current_user_role() = 'worker_member'
  );

-- Only admins can enact proposals
CREATE POLICY proposals_admin_update ON proposals
  FOR UPDATE USING (current_user_role() = 'admin_coop');

-- ─── votes ───────────────────────────────────────────────────────────────────

-- Workers can read all votes (transparency)
CREATE POLICY votes_read_members ON votes
  FOR SELECT USING (
    current_user_role() IN ('worker_member', 'admin_coop')
  );

-- Workers can only cast votes for themselves
CREATE POLICY votes_insert_own ON votes
  FOR INSERT WITH CHECK (
    worker_id = auth.uid()
    AND current_user_role() = 'worker_member'
  );

-- ─── disputes ────────────────────────────────────────────────────────────────

-- Dispute parties and admins can read
CREATE POLICY disputes_parties_read ON disputes
  FOR SELECT USING (
    filed_by = auth.uid()
    OR current_user_role() = 'admin_coop'
    OR auth.uid() = ANY(jury_member_ids)
  );

-- Customers and workers can file disputes
CREATE POLICY disputes_file ON disputes
  FOR INSERT WITH CHECK (
    filed_by = auth.uid()
  );

-- Jury members and admins can update
CREATE POLICY disputes_jury_update ON disputes
  FOR UPDATE USING (
    auth.uid() = ANY(jury_member_ids)
    OR current_user_role() = 'admin_coop'
  );

-- ─── mutual_aid_claims ───────────────────────────────────────────────────────

-- Workers see their own claims
CREATE POLICY claims_worker_read ON mutual_aid_claims
  FOR SELECT USING (worker_id = auth.uid());

-- Admins see all
CREATE POLICY claims_admin_read ON mutual_aid_claims
  FOR SELECT USING (current_user_role() = 'admin_coop');

-- Workers file their own claims
CREATE POLICY claims_worker_insert ON mutual_aid_claims
  FOR INSERT WITH CHECK (
    worker_id = auth.uid()
    AND current_user_role() = 'worker_member'
  );

-- Admins and co-op system process claims
CREATE POLICY claims_admin_update ON mutual_aid_claims
  FOR UPDATE USING (current_user_role() = 'admin_coop');
