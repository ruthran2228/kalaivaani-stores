// ------------------------------------------------------------
// Kalaivani Stores — shared cart + product helpers
// Loaded BEFORE script.js (store page) and cart.js (cart page).
// ------------------------------------------------------------

const PRODUCT_CACHE_KEY = "ks_products_cache";
const CART_KEY = "ks_cart";
const SELECTED_ADDR_KEY = "ks_selected_addr";

function money(value) {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function roundQty(value) {
  const n = Number(value) || 0;
  return Math.round(n * 100) / 100;
}

function fmtQty(value) {
  return String(roundQty(value));
}

// Weight-based ("per kg") products let shoppers pick any amount.
function isWeightUnit(unit) {
  return (
    typeof unit === "string" &&
    /(?:per\s*kg|^\s*kg\s*$)/i.test(unit)
  );
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

// Stable cart key for a product. Never based on the product's position
// in the array — admin edits (add / reorder / delete) must never change
// what's already in a shopper's cart.
//   - DB rows use their real id:            "p123"
//   - Rows without an id (offline fallback) use a content key:
//     name + price + unit + group:          "f<name|price|unit|group>"
function productKey(p) {
  if (!p) return null;
  if (p.id != null && p.id !== "") return "p" + p.id;
  const base = [p.name, p.price, p.unit, p.group_key || ""]
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return "f" + (base || "unknown");
}

function normalizeProducts(list) {
  const seen = new Map();
  return (list || []).map((p) => {
    let key = productKey(p);
    // Two rows can share the same content key (identical name/price/size)
    // — suffix duplicates so each gets its own cart slot.
    const dup = seen.get(key) || 0;
    seen.set(key, dup + 1);
    if (dup) key = key + "#" + (dup + 1);

    return {
      ...p,
      key,
      price: p.price == null ? null : Number(p.price),
      emoji: p.emoji || "🛒",
      category: p.category || "Other",
      unit: p.unit || "",
      image_url: p.image_url || null,
      group_key: p.group_key || null,
      in_stock: p.in_stock !== false,
      featured: p.featured === true
    };
  });
}

// Map of cart key -> product, for resolving cart entries.
function productMap(products) {
  const map = new Map();
  (products || []).forEach((p) => {
    if (p && p.key != null && !map.has(p.key)) map.set(p.key, p);
  });
  return map;
}

// Convert legacy carts (keyed by array INDEX, e.g. {"12": 2}) to stable
// product keys, using the product list the old indexes referred to.
// Mutates the cart in place. Returns true when anything changed.
// `authoritative` should be false when the list is only the hardcoded
// offline fallback — migrating against it could pick wrong products.
function migrateCartKeys(cart, products, authoritative) {
  if (!cart || !authoritative || !products || !products.length) return false;

  const legacy = Object.keys(cart).filter((k) => /^\d+$/.test(k));
  if (!legacy.length) return false;

  const map = productMap(products);
  legacy.forEach((k) => {
    const qty = Number(cart[k]) || 0;
    delete cart[k];
    const p = products[Number(k)];
    const key = p && p.key != null ? p.key : null;
    if (key && map.has(key)) {
      cart[key] = roundQty((Number(cart[key]) || 0) + qty);
    }
    // Legacy entries that no longer resolve are dropped: they were
    // already showing the wrong (or no) product.
  });
  return true;
}

function getCachedProducts() {
  try {
    const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
    return raw ? normalizeProducts(JSON.parse(raw)) : [];
  } catch (error) {
    return [];
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    /* storage unavailable */
  }
}

function getCartTotals(cart, products) {
  let items = 0;
  let total = 0;

  const map = productMap(products);
  Object.entries(cart || {}).forEach(([key, qty]) => {
    const product = map.get(key);
    if (!product) return;
    items += Number(qty) || 0;
    total += Number(product.price || 0) * (Number(qty) || 0);
  });

  return { items, total };
}

function makeOrderNumber() {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `KS-${time}${rand}`;
}

// ------------------------------------------------------------
// Shop status: is the storefront open or temporarily closed?
// Source of truth is the settings row (id=1), written by the admin.
// ------------------------------------------------------------
const SETTINGS_CACHE_KEY = "ks_settings_cache";

async function fetchShopSettings(client) {
  if (client) {
    try {
      const { data, error } = await client
        .from("settings")
        .select("id, shop_open, message")
        .eq("id", 1)
        .maybeSingle();
      if (!error && data) {
        try {
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
        } catch (e) {
          /* storage unavailable */
        }
        return data;
      }
    } catch (error) {
      // settings table missing or offline — fall through to cache
    }
  }

  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (error) {
    /* storage unavailable */
  }

  return null;
}

// Right after OTP verification the session is being written to storage.
// Some browsers (and slower phones) can still read it as "logged out"
// for a moment, so the next page must retry before sending us back to
// the login page.
async function getSessionReady(client) {
  if (!client) return null;
  const attempt = async () => {
    try {
      const { data } = await client.auth.getSession();
      return data && data.session ? data.session : null;
    } catch (error) {
      return null;
    }
  };

  const session = await attempt();
  if (session) return session;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < 5; i++) {
    await wait(300);
    const retry = await attempt();
    if (retry) return retry;
  }
  return null;
}

// ------------------------------------------------------------
// SMOOTH SCROLL - freeze ambient animations while the user
// scrolls. Reduces GPU work so wheel/touch scrolling stays smooth.
// Guarded so it registers once even if two scripts both include it.
// ------------------------------------------------------------
if (typeof window.__ksScrollBusyInit === "undefined") {
  window.__ksScrollBusyInit = true;
  var __ksBusyTimer;
  window.addEventListener(
    "scroll",
    () => {
      document.body.classList.add("scroll-busy");
      clearTimeout(__ksBusyTimer);
      __ksBusyTimer = setTimeout(() => document.body.classList.remove("scroll-busy"), 140);
    },
    { passive: true }
  );
}