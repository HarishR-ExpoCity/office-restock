-- =============================================================
-- Office Restock — database schema
-- Run this in the Supabase SQL editor (SQL Editor -> New query).
-- =============================================================

-- ---- Items: the dropdown list of known consumables ----------
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- Requests: one row per submitted report -----------------
-- status: 'low' | 'out' | 'new_item'
-- item_id is null when status = 'new_item' (free-text request).
create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references public.items (id) on delete set null,
  status      text not null check (status in ('low', 'out', 'new_item')),
  note        text,
  reporter    text,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists requests_open_idx
  on public.requests (resolved, created_at desc);

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.items    enable row level security;
alter table public.requests enable row level security;

-- The public scan page uses the ANON role. It may:
--   * read the ACTIVE item list (to populate the dropdown)
--   * insert a request
-- It may NOT read other people's requests or touch the item list.

drop policy if exists "anon can read active items" on public.items;
create policy "anon can read active items"
  on public.items for select
  to anon
  using (active = true);

-- Anon may submit a request, but cannot forge admin-controlled columns
-- (resolved / resolved_at) or an out-of-range status.
drop policy if exists "anon can submit a request" on public.requests;
create policy "anon can submit a request"
  on public.requests for insert
  to anon
  with check (
    status in ('low', 'out', 'new_item')
    and resolved = false
    and resolved_at is null
  );

-- Authenticated users = the office manager(s) signed into the dashboard.
-- They get full read/write on both tables.

drop policy if exists "authenticated full access to items" on public.items;
create policy "authenticated full access to items"
  on public.items for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated full access to requests" on public.requests;
create policy "authenticated full access to requests"
  on public.requests for all
  to authenticated
  using (true)
  with check (true);

-- =============================================================
-- Seed a few example items (edit / delete freely)
-- =============================================================
insert into public.items (name, category) values
  ('A4 Printer Paper',      'Stationery'),
  ('Printer Toner',         'Stationery'),
  ('Whiteboard Markers',    'Stationery'),
  ('Coffee Pods',           'Pantry'),
  ('Tea Bags',              'Pantry'),
  ('Milk',                  'Pantry')
on conflict do nothing;
