# Kalaivani Stores

Online grocery store for **Kalaivani Stores** (Muniappan Kovil, Komarapalayam) —
browse products, build a cart, order with UPI, and track delivery.

Static HTML/CSS/JS front end + [Supabase](https://supabase.com) (Postgres, Auth, RLS).
No build step, no framework — deploy the folder as-is to any static host.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Storefront (public browsing; sign-in only required to order) |
| `login.html` | Passwordless email-OTP sign-in with privacy consent |
| `cart.html` | Cart + checkout (requires sign-in) |
| `order-confirm.html` | Order success + UPI payment QR |
| `orders.html` | Order history + tracking (requires sign-in) |
| `profile.html` | Name / phone / delivery addresses (requires sign-in) |
| `admin.html` | Admin panel: products, orders, shop settings (admin only) |
| `privacy.html` | Privacy policy (DPDP Act) |

## Setup (Supabase)

1. Create a Supabase project.
2. In **SQL Editor**, run the SQL files **in this exact order**:

   | # | File | When | Safe to re-run? |
   |---|---|---|---|
   | 1 | `seed.sql` | **First time only** — creates + seeds `products` | ❌ **No** — it refuses to run if `products` already has data (it would wipe admin edits) |
   | 2 | `admin_setup.sql` | Orders, settings, RLS, order-validation trigger | ✅ Yes |
   | 3 | `account_setup.sql` | Links orders to customer accounts, order history | ✅ Yes |
   | 4 | `profile_setup.sql` | Customer profiles + addresses | ✅ Yes |
   | 5 | `migrate-images.sql` | Repoints product photos from third-party CDNs to the local `img/` folder | ✅ Yes — idempotent |

3. Create the `product-images` Storage bucket (public) for product photos.
4. Set your config in `config.js`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Project Settings → API)
   - UPI settings (`UPI_ID`, `UPI_QR_IMAGE`, …)
5. Make your admin account an admin:
   `update profiles set is_admin = true where email = 'you@example.com';`
   (see the end of `admin_setup.sql`)

> ⚠️ Never run `seed.sql` against a live store — it recreates the `products`
> table. The run order above is also documented in the `seed.sql` header.

## Architecture notes

- **Cart** (`store-cart.js`) is keyed by **stable product IDs**, not array
  positions, so admin edits (add / reorder / delete) never swap items in a
  shopper's cart. Old index-keyed carts migrate automatically on load.
- **Checkout totals are validated server-side.** The browser sends prices, but
  the `validate_order_totals` trigger in `admin_setup.sql` re-prices every line
  from the `products` table and rewrites the total before the row is stored.
- **Orders require a signed-in customer** (`auth.uid() = user_id`); anonymous
  visitors cannot insert orders. Guest order tracking goes through the
  `get_order_status()` function only.
- **Admin fails closed.** The admin UI renders only when `is_admin()` explicitly
  returns `true`; a missing function or error denies access.
- **`?next=` redirects are same-site only** (`ksSafeNextPath` in `config.js`).
- **Shop status** (open/closed, announcement bar) is edited in
  Admin → Settings and read by the storefront.

## Data files

- `products.csv` — the full live catalog (386 rows, real DB IDs + emoji,
  regenerated from Supabase with local image paths and lowercase
  `true`/`false` booleans so Admin → Import CSV round-trips correctly. Use
  **Admin → Products → Import CSV** to upload; this file is *not* read by the
  site directly.
- `img/` — 297 self-hosted product images (≤ 600 px, ~11 MB). They replaced
  hotlinks to ~130 third-party CDNs that could rot and break product cards.
  A few products still use remote URLs (those hosts blocked downloading);
  cards fall back to emoji if an image ever fails to load.
- SQL files in this repo are the source of truth for schema; CSV is for bulk
  catalog import.

## Local development

Open the files through any static server (or just double-click `index.html`
for a quick look — Supabase calls still need internet access):

```bash
npx serve .
```

## Not done yet (deferred)

- Deployment-specific SEO: `robots.txt`, `sitemap.xml`, canonical/OG URLs
  (needs the final domain).
- Git history starts at this rewrite; identity configured per-commit.

## License / contact

© 2026 Kalaivani Stores. Phone / WhatsApp: 7667771101.
