-- ============================================================
--  Shram Sangam — Migration 002: Governance & Dispute Schema
-- ============================================================

-- ─── ENUM Types ──────────────────────────────────────────────────────────────

CREATE TYPE proposal_status AS ENUM (
  'draft', 'active', 'quorum_not_met', 'passed', 'rejected', 'enacted'
);

CREATE TYPE proposal_category AS ENUM (
  'Fee Adjustment', 'Fund Allocation', 'Policy Change',
  'Platform Feature', 'Guild Rule', 'Emergency Motion'
);

CREATE TYPE vote_decision AS ENUM ('yes', 'no', 'abstain');

CREATE TYPE dispute_status AS ENUM (
  'filed', 'jury_assembled', 'evidence_submitted', 'deliberating', 'resolved'
);

CREATE TYPE dispute_verdict AS ENUM (
  'full_refund_customer', 'full_payout_worker', 'partial_split', 'rebook_required'
);

-- ─── Governance Proposals ─────────────────────────────────────────────────────

CREATE TABLE proposals (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                        TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description                  TEXT NOT NULL CHECK (char_length(description) >= 20),
  category                     proposal_category NOT NULL,
  status                       proposal_status NOT NULL DEFAULT 'draft',
  proposed_by                  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  proposed_platform_fee_percent NUMERIC(4,2) CHECK (
    proposed_platform_fee_percent IS NULL OR
    (proposed_platform_fee_percent >= 0 AND proposed_platform_fee_percent <= 30)
  ),

  -- Voting thresholds
  quorum_threshold             NUMERIC(4,3) NOT NULL DEFAULT 0.5
    CHECK (quorum_threshold BETWEEN 0 AND 1),
  pass_threshold               NUMERIC(4,3) NOT NULL DEFAULT 0.66
    CHECK (pass_threshold BETWEEN 0 AND 1),

  -- Live tally (updated atomically on each vote)
  votes_yes                    INT NOT NULL DEFAULT 0 CHECK (votes_yes >= 0),
  votes_no                     INT NOT NULL DEFAULT 0 CHECK (votes_no >= 0),
  votes_abstain                INT NOT NULL DEFAULT 0 CHECK (votes_abstain >= 0),
  total_eligible_voters        INT NOT NULL DEFAULT 0 CHECK (total_eligible_voters >= 0),

  deadline                     TIMESTAMPTZ NOT NULL,
  enacted_at                   TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Votes ────────────────────────────────────────────────────────────────────

CREATE TABLE votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  decision    vote_decision NOT NULL,
  cast_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 1 member = 1 vote enforcement
  CONSTRAINT unique_vote_per_member UNIQUE (proposal_id, worker_id)
);

-- ─── Disputes & Peer Arbitration ─────────────────────────────────────────────

CREATE TABLE disputes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  filed_by             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reason               TEXT NOT NULL CHECK (char_length(reason) >= 20),
  evidence_urls        TEXT[] NOT NULL DEFAULT '{}',
  status               dispute_status NOT NULL DEFAULT 'filed',
  jury_member_ids      UUID[] NOT NULL DEFAULT '{}',
  verdict              dispute_verdict,
  worker_payout_percent NUMERIC(5,2) CHECK (
    worker_payout_percent IS NULL OR
    (worker_payout_percent BETWEEN 0 AND 100)
  ),
  resolution_notes     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ
);

-- ─── Mutual Aid Claims ────────────────────────────────────────────────────────

CREATE TYPE mutual_aid_claim_status AS ENUM (
  'pending_review', 'peer_review', 'approved', 'rejected', 'disbursed'
);

CREATE TYPE mutual_aid_claim_type AS ENUM (
  'tool_replacement', 'medical_emergency', 'accident_on_site', 'other'
);

CREATE TABLE mutual_aid_claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  claim_type       mutual_aid_claim_type NOT NULL,
  amount_requested NUMERIC(10,2) NOT NULL CHECK (
    amount_requested > 0 AND amount_requested <= 15000
  ),
  description      TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 1000),
  receipt_url      TEXT,
  status           mutual_aid_claim_status NOT NULL DEFAULT 'pending_review',
  peer_approvals   UUID[] NOT NULL DEFAULT '{}',
  approved_amount  NUMERIC(10,2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

-- Add FK from payout_records to claims (deferred from migration 001)
ALTER TABLE payout_records
  ADD CONSTRAINT fk_payout_claim
  FOREIGN KEY (claim_id) REFERENCES mutual_aid_claims(id);
