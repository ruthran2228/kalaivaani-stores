-- ============================================================
-- Kalaivani Stores — Admin setup
-- Run this in Supabase > SQL Editor. Safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Orders table (orders placed from the store are saved here)
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
    check (status in ('new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  order_number text,
  updated_at timestamptz not null default now()
);

-- Customer-facing order number and status-changed timestamp for the tracker
alter table orders add column if not exists order_number text;
alter table orders add column if not exists updated_at timestamptz not null default now();
create unique index if not exists orders_order_number_key on orders(order_number);

-- UPI payment tracking (shop marks an order as paid)
alter table orders add column if not exists paid boolean not null default false;
alter table orders add column if not exists paid_at timestamptz;

-- Order lifecycle: new -> confirmed -> out for delivery -> delivered (or cancelled)
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'));

-- Backfill a friendly order number for existing rows: KS-000001, KS-000002, ...
update orders
set order_number = 'KS-' || lpad(id::text, 6, '0')
where order_number is null;

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
-- 5. Order tracking for shoppers (safe public read)
-- Shoppers call this function with their order number + phone.
-- security definer => bypasses RLS (postgres owns it), and it only
-- ever returns the matching row when BOTH pieces match.
-- ------------------------------------------------------------
-- The function's return type changed as columns were added, and
-- create or replace cannot alter OUT parameters. Drop first.
drop function if exists get_order_status(text, text);

create or replace function get_order_status(
  p_order_number text,
  p_phone text
)
returns table (
  order_number text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  total numeric,
  items jsonb,
  paid boolean,
  paid_at timestamptz
)
language sql stable security definer as $$
  select orders.order_number, orders.status, orders.created_at,
         orders.updated_at, orders.total, orders.items,
         orders.paid, orders.paid_at
  from orders
  where orders.order_number = p_order_number
    and orders.phone = p_phone
$$;

revoke all on function get_order_status(text, text) from public;
grant execute on function get_order_status(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 5b. Realtime: let the admin page refresh instantly when a
-- customer places an order (Supabase broadcasts INSERTs on orders)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;

-- ------------------------------------------------------------
-- 5c. Shop settings: open/closed switch + custom closed message
-- The storefront reads these to show a "Temporarily Closed"
-- notice; the admin page edits them under Settings.
-- ------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1,
  shop_open boolean not null default true,
  message text not null default '',
  updated_at timestamptz not null default now()
);

-- Seed the single settings row
insert into settings (id)
values (1)
on conflict (id) do nothing;

alter table settings enable row level security;

-- Anyone (even signed-out store visitors on the login page) may read
-- the status so the "Temporarily Closed" notice can appear before login
grant select on settings to anon, authenticated;

-- Only admins may write the status / message
grant insert, update, delete on settings to authenticated;

drop policy if exists "Public read settings" on settings;
create policy "Public read settings"
  on settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin insert settings" on settings;
create policy "Admin insert settings"
  on settings for insert
  to authenticated
  with check (is_admin());

drop policy if exists "Admin update settings" on settings;
create policy "Admin update settings"
  on settings for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin delete settings" on settings;
create policy "Admin delete settings"
  on settings for delete
  to authenticated
  using (is_admin());

-- ------------------------------------------------------------
-- 6. First admin account
-- Run this after creating your login user in Authentication > Users.
-- Replace 'you@example.com' with the email you signed up with.
-- ------------------------------------------------------------
-- insert into admin_users (id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict (id) do nothing;