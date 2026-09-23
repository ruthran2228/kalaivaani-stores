// ------------------------------------------------------------
// Kalaivani Stores — shared cart + product helpers
// Loaded BEFORE script.js (store page) and cart.js (cart page).
// ------------------------------------------------------------

const PRODUCT_CACHE_KEY = "ks_products_cache";
const CART_KEY = "ks_cart";
const SELECTED_ADDR_KEY = "ks_selected_addr";

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
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

function normalizeProducts(list) {
  return (list || []).map((p) => ({
    ...p,
    price: p.price == null ? null : Number(p.price),
    emoji: p.emoji || "🛒",
    category: p.category || "Other",
    unit: p.unit || "",
    image_url: p.image_url || null,
    group_key: p.group_key || null,
    in_stock: p.in_stock !== false,
    featured: p.featured === true
  }));
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

  Object.entries(cart || {}).forEach(([idx, qty]) => {
    const product = products ? products[Number(idx)] : null;
    if (!product) return;
    items += qty;
    total += Number(product.price || 0) * qty;
  });

  return { items, total };
}

function makeOrderNumber() {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `KS-${time}${rand}`;
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