-- ============================================================
-- Kalaivani Stores — Customer accounts & order history
-- Run this in Supabase > SQL Editor. Safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Link orders to a customer account (when the shopper signs in)
-- ------------------------------------------------------------
alter table orders add column if not exists user_id uuid;

create index if not exists orders_user_id_idx on orders(user_id);

-- Grant select to authenticated so the My Orders page can read
-- their own rows (RLS below still limits to their own).
grant select on orders to anon, authenticated;

-- Customers may read ONLY their own orders.
-- This is additive to the existing "Admin read orders" policy
-- (admin rows are still visible to admins via is_admin()).
drop policy if exists "Customer read own orders" on orders;
create policy "Customer read own orders"
  on orders for select
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. (Optional) Restrict guest phone-tracking to anon only
--    get_order_status is already security definer and requires
--    both order_number AND phone to match, so it is safe.
--    Nothing to change here — it already exists in admin_setup.sql.
-- ------------------------------------------------------------