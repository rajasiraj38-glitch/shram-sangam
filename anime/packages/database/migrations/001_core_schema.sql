-- ============================================================
--  Shram Sangam — Migration 001: Core Schema
--  Run order: 001 → 002 → 003 → 004
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- For geo-radius queries

-- ─── ENUM Types ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('customer', 'worker_member', 'admin_coop');

CREATE TYPE booking_status AS ENUM (
  'requested', 'accepted', 'arrived', 'in_progress',
  'completed', 'cancelled', 'disputed'
);

CREATE TYPE service_unit AS ENUM ('hour', 'visit', 'job');

CREATE TYPE service_category AS ENUM (
  'Plumbing', 'Electrical', 'Carpentry',
  'Caregiving', 'Cleaning', 'Appliance Repair', 'Painting', 'Other'
);

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users via trigger (or standalone for local dev)

CREATE TABLE profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  role                user_role NOT NULL,
  phone               TEXT NOT NULL CHECK (phone ~ '^\+?[0-9]{10,15}$'),
  email               TEXT UNIQUE,
  avatar_url          TEXT,
  coop_shares         INT NOT NULL DEFAULT 1 CHECK (coop_shares >= 0),
  is_available        BOOLEAN NOT NULL DEFAULT false,
  -- PostGIS geography point (lng, lat)
  location            GEOGRAPHY(POINT, 4326),
  language_preference TEXT NOT NULL DEFAULT 'hi',
  guild_category      service_category,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  vouched_by          UUID[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Service Catalog ─────────────────────────────────────────────────────────

CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  category    service_category NOT NULL,
  description TEXT,
  base_rate   NUMERIC(10,2) NOT NULL CHECK (base_rate > 0),
  unit        service_unit NOT NULL DEFAULT 'hour',
  min_hours   NUMERIC(4,1) NOT NULL DEFAULT 1,
  icon_name   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  worker_id               UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  service_id              UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  status                  booking_status NOT NULL DEFAULT 'requested',

  -- Transparent fee breakdown (immutable after insert)
  total_amount            NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  worker_payout           NUMERIC(10,2) NOT NULL CHECK (worker_payout >= 0),
  coop_reserve_fee        NUMERIC(10,2) NOT NULL CHECK (coop_reserve_fee >= 0),
  mutual_aid_contribution NUMERIC(10,2) NOT NULL CHECK (mutual_aid_contribution >= 0),

  -- Location
  address                 TEXT NOT NULL CHECK (char_length(address) >= 10),
  location                GEOGRAPHY(POINT, 4326),

  -- Scheduling
  scheduled_at            TIMESTAMPTZ,
  notes                   TEXT CHECK (char_length(notes) <= 500),

  -- AI scope estimate (JSONB snapshot)
  ai_estimate             JSONB,

  -- Completion verification
  completion_otp          CHAR(6),
  completed_at            TIMESTAMPTZ,

  -- Dispute
  dispute_reason          TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Business rule: worker_payout + coop_reserve_fee + mutual_aid = total
  CONSTRAINT fee_split_integrity CHECK (
    ABS((worker_payout + coop_reserve_fee + mutual_aid_contribution) - total_amount) < 0.02
  )
);

-- ─── Cooperative Financials ───────────────────────────────────────────────────

CREATE TABLE coop_financials (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operational_reserve         NUMERIC(14,2) NOT NULL DEFAULT 0,
  mutual_aid_reserve          NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_disbursed_to_workers  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_gigs_completed        INT NOT NULL DEFAULT 0,
  period_start                TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  period_end                  TIMESTAMPTZ,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the initial singleton row
INSERT INTO coop_financials DEFAULT VALUES;

-- ─── Patronage Ledger ────────────────────────────────────────────────────────

CREATE TABLE patronage_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_earned   NUMERIC(10,2) NOT NULL CHECK (amount_earned > 0),
  points_accrued  INT NOT NULL DEFAULT 0,
  month           CHAR(7) NOT NULL,  -- "2024-11"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Payout Records ───────────────────────────────────────────────────────────

CREATE TYPE payout_status AS ENUM ('queued', 'processing', 'success', 'failed');
CREATE TYPE payout_type AS ENUM ('job_earnings', 'dividend', 'mutual_aid_grant');

CREATE TABLE payout_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  booking_id          UUID REFERENCES bookings(id),
  claim_id            UUID,  -- FK added in migration 003
  amount              NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payout_type         payout_type NOT NULL,
  status              payout_status NOT NULL DEFAULT 'queued',
  gateway_reference   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at          TIMESTAMPTZ
);
