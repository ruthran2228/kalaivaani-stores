-- ============================================================
-- Kalaivani Stores — Admin setup
-- Run this in Supabase > SQL Editor. Safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Orders table (WhatsApp orders are also saved here)
-- ------------------------------------------------------------
create table if not exists orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  delivery text not null,
  items jsonb not null,
  total numeric not null,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'delivered', 'cancelled'))
);

alter table orders enable row level security;

-- PostgREST roles need table grants too (RLS still protects rows)
grant insert on orders to anon, authenticated;
grant select, update, delete on orders to authenticated;

-- Anyone can place an order (anon = shoppers, no login needed)
drop policy if exists "Public insert orders" on orders;
create policy "Public insert orders"
  on orders for insert
  to anon, authenticated
  with check (true);

-- Only admins can read / update / delete orders
-- (admin policies on orders use is_admin(), created below)

-- ------------------------------------------------------------
-- 2. Admin helper: who is allowed to manage the store
-- ------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table admin_users enable row level security;

-- Nobody gets table-level access; only is_admin() (security definer) reads it.
revoke all on admin_users from anon, authenticated;

-- Nobody reads this table directly via the API; only the is_admin()
-- function below (security definer) can check membership.
drop policy if exists "No public access to admin_users" on admin_users;
create policy "No public access to admin_users"
  on admin_users for select
  using (false);

-- True when the logged-in user is listed in admin_users
create or replace function is_admin()
returns boolean
language sql stable security definer as $$
  select exists (select 1 from admin_users where id = auth.uid())
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

-- ------------------------------------------------------------
-- 3. Products: keep public read, only admins may write
-- ------------------------------------------------------------
-- Allow products to exist without a price until an admin sets one.
alter table products alter column price drop not null;
drop policy if exists "Admin read products" on products;
create policy "Admin read products"
  on products for select
  to authenticated
  using (true);

drop policy if exists "Admin insert products" on products;
create policy "Admin insert products"
  on products for insert
  to authenticated
  with check (is_admin());

drop policy if exists "Admin update products" on products;
create policy "Admin update products"
  on products for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin delete products" on products;
create policy "Admin delete products"
  on products for delete
  to authenticated
  using (is_admin());

-- Table-level grants for the authenticated role (policies above still gate writes)
grant select, insert, update, delete on products to authenticated;

-- ------------------------------------------------------------
-- 4. Orders admin policies (is_admin guards everything)
-- ------------------------------------------------------------
drop policy if exists "Admin read orders" on orders;
create policy "Admin read orders"
  on orders for select
  to authenticated
  using (is_admin());

drop policy if exists "Admin update orders" on orders;
create policy "Admin update orders"
  on orders for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin delete orders" on orders;
create policy "Admin delete orders"
  on orders for delete
  to authenticated
  using (is_admin());

-- ------------------------------------------------------------
-- 5. First admin account
-- Run this after creating your login user in Authentication > Users.
-- Replace 'you@example.com' with the email you signed up with.
-- ------------------------------------------------------------
-- insert into admin_users (id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict (id) do nothing;