-- ============================================================
--  Shram Sangam — Seed 001: Service Catalog
-- ============================================================

INSERT INTO services (id, title, category, description, base_rate, unit, min_hours, icon_name) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Emergency Pipe Repair',
  'Plumbing',
  'Fixing burst pipes, leaks, and drainage blockages. Includes basic parts.',
  600.00, 'hour', 1, 'wrench'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Bathroom Fitting & Installation',
  'Plumbing',
  'Tap, shower, and toilet installation or replacement.',
  500.00, 'hour', 2, 'droplets'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Ceiling Fan & Switch Repair',
  'Electrical',
  'Ceiling fan installation, switch board repair, and circuit troubleshooting.',
  400.00, 'hour', 1, 'zap'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Home Wiring & MCB Fixing',
  'Electrical',
  'New wiring runs, MCB replacement, and load balancing.',
  550.00, 'hour', 2, 'circuit-board'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Elder Companion & Grocery Run',
  'Caregiving',
  'Accompaniment for errands, grocery shopping, and light conversation for senior citizens.',
  350.00, 'hour', 2, 'heart-handshake'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'Post-Surgery Home Assistance',
  'Caregiving',
  'Medication reminders, meal prep, and mobility assistance after hospital discharge.',
  450.00, 'hour', 3, 'stethoscope'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'Deep Home Cleaning (2BHK)',
  'Cleaning',
  'Full deep clean including kitchen, bathrooms, and all rooms.',
  800.00, 'visit', 1, 'sparkles'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Regular Weekly Cleaning',
  'Cleaning',
  'Standard weekly home cleaning and mopping.',
  400.00, 'visit', 1, 'brush'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Wooden Furniture Repair',
  'Carpentry',
  'Door hinges, cabinet fixing, and minor wood furniture restoration.',
  450.00, 'hour', 1, 'hammer'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'AC Service & Cleaning',
  'Appliance Repair',
  'Split and window AC filter cleaning, gas check, and servicing.',
  700.00, 'visit', 1, 'wind'
),
(
  'a1000000-0000-0000-0000-000000000011',
  'Washing Machine Repair',
  'Appliance Repair',
  'Drum issues, motor faults, panel errors for top-load and front-load machines.',
  500.00, 'visit', 1, 'washing-machine'
),
(
  'a1000000-0000-0000-0000-000000000012',
  'Interior Wall Painting (per room)',
  'Painting',
  'One room interior painting with prep, primer, and two finish coats.',
  2500.00, 'job', 1, 'paint-roller'
);
