# PulsePages — Build Plan

## The Problem (from Reddit research)
Freelancers and small agencies manage client relationships across 5+ disconnected tools:
- Proposals in Google Docs
- Contracts via DocuSign/HelloSign
- Invoices through Stripe/PayPal links
- Project updates via email/Slack
- Files in Google Drive/Dropbox

Result: unprofessional experience, lost deals, late payments, no single source of truth.

## The Solution
**PulsePages** — A client portal platform where freelancers create branded project pages that handle the entire client lifecycle: proposal → approval → project tracking → invoicing → payment.

Each client gets a unique link (pulse.page/project-xyz) with:
- Professional proposal with scope & pricing
- One-click approval (digital signature)
- Real-time project milestones/updates
- Invoice generation & Stripe payments
- File sharing
- Activity feed showing all interactions

## Target User
- Freelance developers, designers, consultants
- Small agencies (2-10 people)
- Coaches, photographers, wedding planners
- Anyone who sends proposals and invoices

## Pricing Model
- **Free:** 1 active project, basic features
- **Pro ($19/mo):** Unlimited projects, custom branding, Stripe payments
- **Agency ($49/mo):** Team members, client CRM, analytics

## Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth + Database + Storage)
- Stripe (Payments — both subscription & client invoicing)
- Tailwind CSS
- Deployed on Vercel

## Database Schema

### users
- id (uuid, PK)
- email
- full_name
- business_name
- avatar_url
- stripe_customer_id
- stripe_subscription_id
- plan (free/pro/agency)
- created_at

### projects
- id (uuid, PK)
- user_id (FK → users)
- client_name
- client_email
- title
- description
- status (draft/sent/approved/in_progress/completed/cancelled)
- slug (unique, for public URL)
- total_amount (cents)
- currency
- proposal_content (jsonb — rich text)
- approved_at
- created_at
- updated_at

### milestones
- id (uuid, PK)
- project_id (FK → projects)
- title
- description
- status (pending/in_progress/completed)
- due_date
- completed_at
- sort_order
- created_at

### invoices
- id (uuid, PK)
- project_id (FK → projects)
- amount (cents)
- currency
- status (draft/sent/paid/overdue)
- stripe_payment_intent_id
- stripe_payment_link
- due_date
- paid_at
- created_at

### activities
- id (uuid, PK)
- project_id (FK → projects)
- actor (owner/client)
- action (created/updated/approved/paid/commented/milestone_completed)
- description
- metadata (jsonb)
- created_at

## Pages & Routes

### Auth (Supabase Auth)
- /login
- /signup
- /auth/callback

### Dashboard (authenticated)
- / — Dashboard (project list, stats, recent activity)
- /projects/new — Create project
- /projects/[id] — Project detail (edit proposal, milestones, invoices)
- /settings — Profile, billing, Stripe connect

### Public Client Portal (no auth required)
- /p/[slug] — Client-facing project page
  - Proposal view
  - Approve button
  - Milestone tracker
  - Invoice & pay button
  - Activity feed

### API Routes
- /api/stripe/webhook — Handle Stripe events
- /api/stripe/create-checkout — Subscription checkout
- /api/stripe/create-payment-link — Invoice payment link
- /api/projects/[id]/approve — Client approval endpoint

## Build Order (4 hours)

### Phase 1: Foundation (45 min)
- [x] Next.js project setup with Tailwind
- [x] Supabase project creation + schema
- [x] Supabase Auth integration (email/password)
- [x] Basic layout (sidebar nav, responsive)

### Phase 2: Core Features (90 min)
- [ ] Dashboard with project cards
- [ ] Create/edit project form
- [ ] Milestone management (add/edit/reorder/complete)
- [ ] Public client portal page (/p/[slug])
- [ ] Client approval flow

### Phase 3: Payments (45 min)
- [ ] Stripe integration setup
- [ ] Subscription checkout (Pro/Agency plans)
- [ ] Invoice creation with Stripe Payment Links
- [ ] Webhook handling for payment confirmations

### Phase 4: Polish & Test (30 min)
- [ ] Activity feed
- [ ] Responsive design pass
- [ ] Error handling & loading states
- [ ] README with setup instructions
- [ ] Environment variable documentation

## Credentials & Services (to document)
- Supabase project URL + keys
- Stripe API keys
- Vercel deployment (if time permits)
