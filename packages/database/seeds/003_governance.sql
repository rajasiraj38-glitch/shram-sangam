-- ============================================================
--  Shram Sangam — Seed 003: Governance Proposals & Votes
--  Realistic active ballots for hackathon demo
-- ============================================================

-- ─── Active Proposals ────────────────────────────────────────────────────────

INSERT INTO proposals (
  id, title, description, category, status, proposed_by,
  proposed_platform_fee_percent, quorum_threshold, pass_threshold,
  votes_yes, votes_no, votes_abstain, total_eligible_voters,
  deadline
) VALUES
(
  'p0000000-0000-0000-0000-000000000001',
  'Lower Platform Fee from 7% to 5%',
  'Q3 operational surplus allows us to reduce platform fee retention from 7% to 5%, increasing worker take-home from ₹90 to ₹92 per ₹100 billed. The 2% difference will be added to worker payouts directly.',
  'Fee Adjustment',
  'active',
  'w0000000-0000-0000-0000-000000000001',
  5.00, 0.5, 0.66,
  4, 1, 1, 7,
  NOW() + INTERVAL '3 days'
),
(
  'p0000000-0000-0000-0000-000000000002',
  'Allocate 20% of Mutual Aid to Tool Replacement Grants',
  'Workers report tool breakage as the #1 reason for declining gigs. Reserving 20% of the mutual aid pool specifically for tool replacement grants (up to ₹5,000 per claim) will reduce gig cancellations by an estimated 30%.',
  'Fund Allocation',
  'active',
  'w0000000-0000-0000-0000-000000000003',
  NULL, 0.5, 0.66,
  5, 0, 0, 7,
  NOW() + INTERVAL '5 days'
),
(
  'p0000000-0000-0000-0000-000000000003',
  'Add Child & Infant Care as a New Service Category',
  'Three workers with childcare certification have requested opening a "Child & Infant Care" guild to serve working parents. Requires background verification protocol amendment.',
  'Policy Change',
  'active',
  'w0000000-0000-0000-0000-000000000007',
  NULL, 0.5, 0.66,
  2, 2, 1, 7,
  NOW() + INTERVAL '7 days'
),
(
  'p0000000-0000-0000-0000-000000000004',
  'Emergency SOS Dispatch Protocol — Formal Adoption',
  'Formalise the 60-minute heartbeat check-in system for workers in active gigs. Failure to respond triggers automatic alert to nearby co-op members and listed emergency contacts.',
  'Policy Change',
  'passed',
  'w0000000-0000-0000-0000-000000000002',
  NULL, 0.5, 0.66,
  6, 0, 1, 7,
  NOW() - INTERVAL '2 days'
);

-- ─── Sample Votes ─────────────────────────────────────────────────────────────

-- Votes on proposal 1 (Fee Reduction)
INSERT INTO votes (proposal_id, worker_id, decision) VALUES
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'yes'),
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'yes'),
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000003', 'yes'),
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000004', 'no'),
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000005', 'yes'),
('p0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000006', 'abstain');

-- Votes on proposal 2 (Tool Fund)
INSERT INTO votes (proposal_id, worker_id, decision) VALUES
('p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000001', 'yes'),
('p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000002', 'yes'),
('p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000004', 'yes'),
('p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000005', 'yes'),
('p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000006', 'yes');

-- ─── Sample Mutual Aid Claim ──────────────────────────────────────────────────

INSERT INTO mutual_aid_claims (
  id, worker_id, claim_type, amount_requested, description,
  status, peer_approvals
) VALUES
(
  'mac00000-0000-0000-0000-000000000001',
  'w0000000-0000-0000-0000-000000000004',
  'tool_replacement',
  3200.00,
  'My pipe wrench set broke during an emergency job at the customer site. The replacement set costs ₹3,200 and I have the invoice. I have completed 22 gigs and hold active membership.',
  'peer_review',
  ARRAY[
    'w0000000-0000-0000-0000-000000000001'::UUID,
    'w0000000-0000-0000-0000-000000000002'::UUID
  ]
);
