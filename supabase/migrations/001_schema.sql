-- PulsePages Database Schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  business_name text,
  avatar_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'in_progress', 'completed', 'cancelled')),
  slug text unique not null,
  total_amount bigint not null default 0,
  currency text not null default 'usd',
  proposal_content text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Owner can do everything with their own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Public access by slug (for client portal)
create policy "Public can view projects by slug"
  on public.projects for select
  using (true);

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

create policy "Users can view milestones of own projects"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Public can view milestones by project"
  on public.milestones for select
  using (true);

create policy "Users can create milestones for own projects"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update milestones of own projects"
  on public.milestones for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete milestones of own projects"
  on public.milestones for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  amount bigint not null,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  stripe_payment_intent_id text,
  stripe_payment_link text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Users can view invoices of own projects"
  on public.invoices for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = invoices.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Public can view invoices by project"
  on public.invoices for select
  using (true);

create policy "Users can create invoices for own projects"
  on public.invoices for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = invoices.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update invoices of own projects"
  on public.invoices for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = invoices.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete invoices of own projects"
  on public.invoices for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = invoices.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor text not null default 'owner' check (actor in ('owner', 'client', 'system')),
  action text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Users can view activities of own projects"
  on public.activities for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = activities.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Public can view activities by project"
  on public.activities for select
  using (true);

create policy "Users can create activities for own projects"
  on public.activities for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = activities.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Anyone can insert activities (for client actions like approval)
create policy "Public can create activities"
  on public.activities for insert
  with check (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_slug on public.projects(slug);
create index idx_milestones_project_id on public.milestones(project_id);
create index idx_invoices_project_id on public.invoices(project_id);
create index idx_activities_project_id on public.activities(project_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at on projects
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_project_updated
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
