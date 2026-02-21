# PulsePages — Quick Setup Guide (for Timbot)

## What's Built
Complete SaaS app: auth, dashboard, project management, client portal, Stripe payments.
27 source files, 14 routes, zero build errors.

## To Get It Running (10 minutes)

### Step 1: Supabase Project
1. Go to https://supabase.com/dashboard
2. Create new project called "pulsepages"
3. Go to SQL Editor → paste contents of `supabase/migrations/001_schema.sql` → Run
4. Go to Project Settings → API → copy URL + anon key + service role key

### Step 2: Stripe (optional for first test)
1. Go to https://dashboard.stripe.com
2. Get test API keys
3. Create 2 products: Pro ($19/mo), Agency ($49/mo)
4. Copy price IDs

### Step 3: Environment
```bash
cp .env.local.example .env.local
# Fill in the values from steps 1 & 2
```

### Step 4: Run
```bash
npm run dev
# Open http://localhost:3000
```

### Step 5: Test Flow
1. Sign up at /signup
2. Create a project → add milestones → add invoice
3. Copy the client portal link (/p/your-slug)
4. Open in incognito → see the public portal
5. Click "Approve" on the proposal
6. Client pays via Stripe link on invoices

### Step 6: Deploy to Vercel
```bash
# Push to GitHub first, then:
# Import on vercel.com, add env vars, done.
```

## No External Accounts Created
I couldn't access Supabase/Stripe without your credentials. Everything is code-complete — you just need to:
1. Create a Supabase project (free tier)
2. Run the SQL migration
3. Add env vars
4. Optionally connect Stripe for payments
