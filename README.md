# PulsePages

A client portal and proposal platform for freelancers and small agencies. Send proposals, track milestones, invoice clients, and get paid — all through one branded link.

## Features

- **Client Portals** — Each project gets a unique public URL (`/p/project-slug`) clients can access without logging in
- **Proposals** — Write and send proposals that clients can approve with one click
- **Milestone Tracking** — Create milestones, track progress, mark completions
- **Invoicing** — Generate invoices with Stripe payment links
- **Activity Feed** — Full timeline of project events
- **Subscription Billing** — Free, Pro ($19/mo), and Agency ($49/mo) plans via Stripe

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Icons:** lucide-react

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the migration file: `supabase/migrations/001_schema.sql`
3. Copy your project URL and keys from Project Settings → API

### 3. Set up Stripe

1. Get your API keys from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Create two subscription products in Stripe:
   - **Pro** — $19/month
   - **Agency** — $49/month
3. Copy the price IDs
4. Set up a webhook endpoint pointing to `your-domain/api/stripe/webhook` with these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.deleted`

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated dashboard
│   │   ├── layout.tsx        # Sidebar + top bar
│   │   ├── page.tsx          # Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx      # Projects list
│   │   │   ├── new/page.tsx  # Create project
│   │   │   └── [id]/page.tsx # Project detail (tabs)
│   │   └── settings/page.tsx # Profile & billing
│   ├── login/page.tsx        # Login
│   ├── signup/page.tsx       # Register
│   ├── auth/callback/route.ts
│   ├── p/[slug]/             # Public client portal
│   │   ├── page.tsx          # Server component
│   │   └── approve-button.tsx
│   └── api/
│       ├── projects/[id]/approve/route.ts
│       └── stripe/
│           ├── webhook/route.ts
│           ├── create-checkout/route.ts
│           └── create-payment-link/route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   ├── stripe.ts
│   └── types.ts
├── middleware.ts              # Auth session refresh
supabase/
└── migrations/
    └── 001_schema.sql
```

## Database Schema

- **users** — Profile, plan, Stripe IDs
- **projects** — Title, client info, status, slug, proposal content, amount
- **milestones** — Per-project milestones with status tracking
- **invoices** — Per-project invoices with Stripe payment links
- **activities** — Timeline of all project events

All tables use Row Level Security (RLS). Users can only access their own data. Public client portal pages read project data via the `slug` field.

## Deployment

Deploy to [Vercel](https://vercel.com):

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Update `NEXT_PUBLIC_APP_URL` to your production URL
5. Update Stripe webhook URL to production endpoint
