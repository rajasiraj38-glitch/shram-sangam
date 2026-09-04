# Shram Sangam App

The canonical Shram Sangam experience is now one app with three modes:

- **Customer**: discover local services and request a job.
- **Worker member**: manage availability, review fair dispatch, and track earnings.
- **Co-op assembly**: review proposals and cast one-member-one-vote decisions.

Run it from the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and switch modes from the top navigation.

The original customer, worker, and governance Next.js apps remain in the repository as legacy implementations while their API and database workflows are progressively moved into this unified shell. Run the old multi-app setup with `npm run dev:legacy` when needed.
