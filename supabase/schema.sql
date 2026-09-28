-- Lanila Wedding Planner — proposed schema
-- Assumes a shared `profiles` table already exists (or will exist) as the
-- Lanila-ecosystem identity layer, keyed 1:1 to auth.users.id. Every table
-- below references profiles(id), never auth.users directly, so this schema
-- works whether Buku Kas's identity table is called `profiles`, `users`, or
-- something else — only the FK target needs adjusting.

create extension if not exists "pgcrypto";

-- ============================================================
-- Shared identity (create only if it does not already exist)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Workspace + membership
-- ============================================================
create table wedding_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- e.g. "Ayu & Angga"
  wedding_date date,
  wedding_type text,
  venue text,
  target_budget numeric(14,2) default 0,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                 -- soft delete
);

create type wedding_role as enum ('owner', 'partner', 'viewer');

create table wedding_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role wedding_role not null default 'partner',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (workspace_id, profile_id)
);

-- ============================================================
-- Preparation map
-- ============================================================
create type preparation_status as enum ('belum', 'diproses', 'selesai', 'tertunda');

create table preparation_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  name text not null,
  order_index int not null default 0
);

create table preparation_items (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references preparation_stages (id) on delete cascade,
  title text not null,
  status preparation_status not null default 'belum',
  deadline date,
  responsible_profile_id uuid references profiles (id),
  notes text,
  document_id uuid,                      -- fk added after `documents` exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Tasks / timeline
-- ============================================================
create type task_status as enum ('todo', 'in_progress', 'completed', 'delayed');
create type task_priority as enum ('low', 'medium', 'high', 'critical');

create table wedding_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  title text not null,
  category text,
  assignee_profile_id uuid references profiles (id),
  start_date date,
  deadline date,
  priority task_priority not null default 'medium',
  status task_status not null default 'todo',
  linked_preparation_item_id uuid references preparation_items (id),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Budget
-- ============================================================
create type payment_status as enum ('belum_bayar', 'dp', 'lunas');

create table wedding_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  total_target numeric(14,2) default 0
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  name text not null,
  category text,
  contact_person text,
  phone text,
  address text,
  price numeric(14,2) default 0,
  dp_amount numeric(14,2) default 0,
  status text not null default 'research',
  payment_deadline date,
  notes text,
  created_at timestamptz not null default now()
);

create table wedding_budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references wedding_budgets (id) on delete cascade,
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  category text not null,
  name text not null,
  planned_amount numeric(14,2) not null default 0,
  actual_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  vendor_id uuid references vendors (id),
  deadline date,
  payment_status payment_status not null default 'belum_bayar',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Shared financial engine (also written to by Lanila Buku Kas)
-- ============================================================
create table financial_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id),
  workspace_id uuid references wedding_workspaces (id),      -- null for non-wedding transactions
  source_app text not null default 'wedding_planner',        -- 'wedding_planner' | 'buku_kas' | ...
  related_budget_item_id uuid references wedding_budget_items (id),
  amount numeric(14,2) not null,
  type text not null,                                        -- 'expense' | 'income'
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Guests / gifts / seserahan
-- ============================================================
create type rsvp_status as enum ('belum', 'hadir', 'tidak_hadir');

create table guests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  name text not null,
  category text,
  relationship text,
  phone text,
  pax int not null default 1,
  rsvp rsvp_status not null default 'belum',
  table_number text,
  gift_status text,
  notes text
);

create table gift_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  donor_name text,
  gift_type text not null,             -- 'cash' | 'transfer' | 'physical' | 'other'
  amount numeric(14,2),
  notes text,
  recorded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table seserahan_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  name text not null,
  category text,
  planned_budget numeric(14,2) default 0,
  actual_cost numeric(14,2) default 0,
  status text not null default 'belum',
  purchase_date date,
  photo_url text,
  notes text
);

-- ============================================================
-- Events, documents, activity, notifications
-- ============================================================
create table wedding_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  event_type text not null,            -- 'akad' | 'resepsi'
  event_date date,
  event_time time,
  location text,
  notes text
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  group_name text not null,            -- 'administration' | 'vendor' | 'wedding'
  file_path text not null,             -- Supabase Storage path, private bucket
  uploaded_by uuid references profiles (id),
  is_private boolean not null default true,
  created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  action text not null,
  object_type text,
  object_id uuid,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references wedding_workspaces (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index on wedding_members (profile_id);
create index on preparation_items (stage_id);
create index on wedding_tasks (workspace_id, status);
create index on wedding_budget_items (workspace_id);
create index on vendors (workspace_id);
create index on guests (workspace_id);
create index on financial_transactions (profile_id);
create index on activity_logs (workspace_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Every workspace-scoped table follows the same pattern: a row is visible
-- only to members of its workspace, and writable only to members whose role
-- allows it (viewer = read-only). Shown once in full for wedding_tasks;
-- apply the same shape to preparation_items, vendors, guests,
-- wedding_budget_items, seserahan_items, documents, wedding_events,
-- gift_records, activity_logs and notifications.

alter table wedding_workspaces enable row level security;
alter table wedding_members enable row level security;
alter table wedding_tasks enable row level security;
-- ... enable on every other workspace-scoped table the same way.

create policy "members can read their workspace"
  on wedding_workspaces for select
  using (
    exists (
      select 1 from wedding_members m
      where m.workspace_id = wedding_workspaces.id
        and m.profile_id = auth.uid()
    )
  );

create policy "owner can update workspace"
  on wedding_workspaces for update
  using (
    exists (
      select 1 from wedding_members m
      where m.workspace_id = wedding_workspaces.id
        and m.profile_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy "members can read their membership rows"
  on wedding_members for select
  using (
    exists (
      select 1 from wedding_members m2
      where m2.workspace_id = wedding_members.workspace_id
        and m2.profile_id = auth.uid()
    )
  );

create policy "members can read tasks"
  on wedding_tasks for select
  using (
    exists (
      select 1 from wedding_members m
      where m.workspace_id = wedding_tasks.workspace_id
        and m.profile_id = auth.uid()
    )
  );

create policy "owner/partner can write tasks"
  on wedding_tasks for insert
  with check (
    exists (
      select 1 from wedding_members m
      where m.workspace_id = wedding_tasks.workspace_id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'partner')
    )
  );

create policy "owner/partner can update tasks"
  on wedding_tasks for update
  using (
    exists (
      select 1 from wedding_members m
      where m.workspace_id = wedding_tasks.workspace_id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'partner')
    )
  );

-- Storage: documents bucket should be private, with access granted only
-- through a signed URL generated server-side after checking wedding_members
-- membership — never make the bucket or its paths publicly readable.
