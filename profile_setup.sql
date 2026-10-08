-- ============================================================
-- Kalaivani Stores — Customer profile table
-- Run this in Supabase > SQL Editor. Safe to run multiple times.
-- After running, upload the new cart.html / profile.html files.
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles table: one row per customer account
--    name/phone/email + a list of saved delivery addresses (JSON).
-- ------------------------------------------------------------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  phone      text not null default '',
  email      text not null default '',
  addresses  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Customers can read only their own profile.
drop policy if exists "Profiles own select" on public.profiles;
create policy "Profiles own select"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

-- Customers can insert their own profile (first-time setup).
drop policy if exists "Profiles own insert" on public.profiles;
create policy "Profiles own insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Customers can update only their own profile.
drop policy if exists "Profiles own update" on public.profiles;
create policy "Profiles own update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.profiles to authenticated;