// ============================================================
// Kalaivani Stores v3 — products loaded live from Supabase
// ============================================================

// --- Supabase client (config.js loads first) ---
let supabaseClient = null;

try {
  if (
    typeof window.supabase !== "undefined" &&
    typeof SUPABASE_URL !== "undefined" &&
    typeof SUPABASE_ANON_KEY !== "undefined"
  ) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
} catch (error) {
  console.warn("Supabase init failed:", error);
}

const PRODUCT_CACHE_KEY = "ks_products_v1";

// --- Fallback catalog (used offline / while Supabase is empty) ---
const FALLBACK_PRODUCTS = [
  // SNACKS
  { name: "GoodDay Biscuit", emoji: "🍪", category: "Snacks", price: 5, unit: "per pack", group_key: "GoodDay Biscuit" },
  { name: "GoodDay Biscuit", emoji: "🍪", category: "Snacks", price: 10, unit: "per pack", group_key: "GoodDay Biscuit" },
  { name: "GoodDay Biscuit", emoji: "🍪", category: "Snacks", price: 20, unit: "per pack", group_key: "GoodDay Biscuit" },
  { name: "GoodDay Biscuit", emoji: "🍪", category: "Snacks", price: 50, unit: "per pack", group_key: "GoodDay Biscuit" },
  { name: "GoodDay Biscuit chocolate", emoji: "🍪", category: "Snacks", price: 10, unit: "per pack", group_key: "GoodDay Biscuit chocolate" },
  { name: "Britannia Bourbon", emoji: "🍪", category: "Snacks", price: 10, unit: "per pack", group_key: "Britannia Bourbon" },
  { name: "Britannia Bourbon", emoji: "🍪", category: "Snacks", price: 20, unit: "per pack", group_key: "Britannia Bourbon" },
  { name: "Marie Gold", emoji: "🍪", category: "Snacks", price: 10, unit: "per pack", group_key: "Marie Gold" },
  { name: "Marie Gold", emoji: "🍪", category: "Snacks", price: 30, unit: "per pack", group_key: "Marie Gold" },
  { name: "Parle-G Biscuit", emoji: "🍘", category: "Snacks", price: 5, unit: "per pack", group_key: "Parle-G Biscuit" },
  { name: "Parle-G Biscuit", emoji: "🍘", category: "Snacks", price: 10, unit: "per pack", group_key: "Parle-G Biscuit" },
  { name: "Sunfeast Biscuit", emoji: "🍘", category: "Snacks", price: 5, unit: "per pack", group_key: null },
  { name: "Lay's Chips", emoji: "🥔", category: "Snacks", price: 20, unit: "per pack", group_key: null },
  { name: "Bourbon Biscuit", emoji: "🍫", category: "Snacks", price: 20, unit: "per pack", group_key: null },
  { name: "Murukku", emoji: "🌀", category: "Snacks", price: 30, unit: "per pack", group_key: null },
  { name: "Mixture", emoji: "🥜", category: "Snacks", price: 20, unit: "per pack", group_key: null },

  // BEVERAGES
  { name: "Pepsi – 500ml", emoji: "🥤", category: "Beverages", price: 40, unit: "bottle", group_key: null },
  { name: "Frooti – 200ml", emoji: "🧃", category: "Beverages", price: 15, unit: "pack", group_key: null },
  { name: "Sprite – 500ml", emoji: "🍾", category: "Beverages", price: 40, unit: "bottle", group_key: null },
  { name: "Energy Drink", emoji: "⚡", category: "Beverages", price: 80, unit: "can", group_key: null },
  { name: "Buttermilk", emoji: "🫙", category: "Beverages", price: 20, unit: "pack", group_key: null },
  { name: "Water Bottle – 1L", emoji: "💧", category: "Beverages", price: 20, unit: "bottle", group_key: null },

  // DAIRY
  { name: "Milk – 500ml", emoji: "🥛", category: "Dairy", price: 27, unit: "packet", group_key: null },
  { name: "Curd – 200g", emoji: "🍶", category: "Dairy", price: 25, unit: "cup", group_key: null },
  { name: "Butter – 100g", emoji: "🧈", category: "Dairy", price: 55, unit: "pack", group_key: null },
  { name: "Paneer – 200g", emoji: "🫙", category: "Dairy", price: 90, unit: "pack", group_key: null },

  // GROCERIES
  { name: "Rice – 1 kg", emoji: "🍚", category: "Groceries", price: 70, unit: "per kg", group_key: null },
  { name: "Toor Dal – 500g", emoji: "🫘", category: "Groceries", price: 65, unit: "pack", group_key: null },
  { name: "Sugar – 1 kg", emoji: "🍬", category: "Groceries", price: 45, unit: "per kg", group_key: null },
  { name: "Cooking Oil – 1L", emoji: "🫙", category: "Groceries", price: 140, unit: "bottle", group_key: null },
  { name: "Salt – 1 kg", emoji: "🧂", category: "Groceries", price: 20, unit: "pack", group_key: null },
  { name: "Atta – 1 kg", emoji: "🌾", category: "Groceries", price: 55, unit: "pack", group_key: null },
  { name: "Tomato – 500g", emoji: "🍅", category: "Groceries", price: 30, unit: "500g", group_key: null },
  { name: "Onion – 1 kg", emoji: "🧅", category: "Groceries", price: 40, unit: "per kg", group_key: null },
  { name: "Potato – 1 kg", emoji: "🥔", category: "Groceries", price: 35, unit: "per kg", group_key: null },

  // QUICK MEALS
  { name: "Maggi Noodles", emoji: "🍜", category: "Quick meals", price: 15, unit: "per pack", group_key: null },
  { name: "Yippee Noodles", emoji: "🍜", category: "Quick meals", price: 15, unit: "per pack", group_key: null },
  { name: "Cup Noodles", emoji: "🍵", category: "Quick meals", price: 30, unit: "per cup", group_key: null },
  { name: "MTR Upma Mix", emoji: "🫕", category: "Quick meals", price: 45, unit: "per pack", group_key: null },
  { name: "Poha – 500g", emoji: "🍚", category: "Quick meals", price: 35, unit: "per pack", group_key: null },

  // BATH & BODY
  { name: "Bath Soap", emoji: "🧼", category: "Bath & Body", price: 40, unit: "per bar", group_key: null },
  { name: "Shampoo Sachet", emoji: "🧴", category: "Bath & Body", price: 5, unit: "per sachet", group_key: null },
  { name: "Toothpaste – 100g", emoji: "🦷", category: "Bath & Body", price: 50, unit: "tube", group_key: null },
  { name: "Toothbrush", emoji: "🪥", category: "Bath & Body", price: 30, unit: "each", group_key: null },
  { name: "Sanitary Pads", emoji: "🩸", category: "Bath & Body", price: 55, unit: "per pack", group_key: null },

  // HOME CLEANING
  { name: "Washing Powder", emoji: "🧺", category: "Home Cleaning", price: 60, unit: "per pack", group_key: null },
  { name: "Dish Soap", emoji: "🫧", category: "Home Cleaning", price: 35, unit: "per bar", group_key: null },
  { name: "Phenyl – 500ml", emoji: "🧽", category: "Home Cleaning", price: 60, unit: "bottle", group_key: null },

  // STATIONERY
  { name: "Notebook – 200 pages", emoji: "📓", category: "Stationery", price: 60, unit: "each", group_key: null },
  { name: "Pen (Blue)", emoji: "🖊️", category: "Stationery", price: 10, unit: "each", group_key: null },
  { name: "Pencil Set", emoji: "✏️", category: "Stationery", price: 20, unit: "per pack", group_key: null },
  { name: "Stapler", emoji: "📌", category: "Stationery", price: 80, unit: "each", group_key: null }
].map((p, i) => ({
  ...p,
  image_url: null,
  in_stock: true,
  featured: false,
  sort_order: i
}));

const WA_NUMBER = "917667771101";

const CATEGORY_EMOJIS = {
  All: "✨",
  Snacks: "🍪",
  Beverages: "🥤",
  Dairy: "🥛",
  Groceries: "🍚",
  "Quick meals": "🍜",
  "Bath & Body": "🧴",
  "Home Cleaning": "🧹",
  Stationery: "📚"
};

const cart = {};
let PRODUCTS = [];
let activeCategory = "All";
let quickFilter = null;
let sortBy = "default";
let lastFocused = null;

const $ = (id) => document.getElementById(id);

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

function normalizeCat(cat) {
  if (!cat) return cat;
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function groupProducts(products) {
  const groups = {};
  products.forEach((p) => {
    const key = p.group_key || p.name;
    if (!groups[key]) {
      groups[key] = {
        name: p.name,
        category: p.category,
        emoji: p.emoji,
        image_url: p.image_url,
        featured: p.featured,
        in_stock: p.in_stock,
        variants: []
      };
    }
    groups[key].variants.push(p);
  });
  return Object.values(groups);
}

function setQty(index, qty) {
  qty = Math.max(0, Number(qty) || 0);
  if (qty === 0) {
    delete cart[index];
  } else {
    cart[index] = qty;
  }
  updateCart();
}

function applyURLState() {
  try {
    const params = new URLSearchParams(window.location.search);

    const cat = params.get("cat");
    if (cat) activeCategory = normalizeCat(cat);

    const sort = params.get("sort");
    if (
      sort &&
      ["price-asc", "price-desc", "name-asc", "default"].includes(sort)
    ) {
      sortBy = sort;
    }

    $("sort-select").value = sortBy;

    const q = params.get("q");
    if (q != null) $("search-input").value = q;
  } catch (error) {
    /* ignore */
  }
}

function syncURLState() {
  try {
    const params = new URLSearchParams();

    if (activeCategory && activeCategory !== "All") {
      params.set("cat", activeCategory);
    }

    if (sortBy && sortBy !== "default") {
      params.set("sort", sortBy);
    }

    const q = $("search-input").value.trim();
    if (q) params.set("q", q);

    const query = params.toString();
    history.replaceState(
      null,
      "",
      window.location.pathname + (query ? `?${query}` : "")
    );
  } catch (error) {
    /* ignore */
  }
}

function normalizeProducts(list) {
  return (list || []).map((p) => ({
    ...p,
    price: Number(p.price),
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

function productMatches(product, query) {
  if (!query) return true;

  const text =
    `${product.name} ${product.category} ${product.unit || ""}`.toLowerCase();

  return text.includes(query.toLowerCase());
}

function getFilteredProducts() {
  const query = $("search-input").value.trim();

  let products = PRODUCTS.filter((product) => {
    const categoryOK =
      activeCategory === "All" || normalizeCat(product.category) === activeCategory;

    const searchOK = productMatches(product, query);

    const quickOK =
      quickFilter === "under50"
        ? product.price <= 50
        : quickFilter === "popular"
          ? product.price <= 100
          : true;

    return categoryOK && searchOK && quickOK;
  });

  switch (sortBy) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      products.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
      break;
  }

  return products;
}

function buildCategoryTabs() {
  const categories = [
    "All",
    ...new Set(PRODUCTS.map((p) => normalizeCat(p.category)).filter(Boolean))
  ];

  if (PRODUCTS.length && !categories.includes(activeCategory)) {
    activeCategory = "All";
  }

  $("cat-bar").innerHTML = categories
    .map((cat) => {
      const emoji = CATEGORY_EMOJIS[cat] || "🛒";
      return `<button class="cat-tab${
        cat === activeCategory ? " active" : ""
      }" data-cat="${esc(cat)}" type="button">${emoji} ${esc(cat)}</button>`;
    })
    .join("");
}

function renderProducts() {
  const grid = $("product-grid");
  const empty = $("empty-state");
  const products = getFilteredProducts();

  grid.innerHTML = "";

  $("result-count").textContent =
    `${products.length} product${products.length === 1 ? "" : "s"}`;

  const groups = groupProducts(products);

  groups.forEach((group) => {
    const firstVariant = group.variants[0];
    const activeIdx = PRODUCTS.indexOf(firstVariant);
    const qty = cart[activeIdx] || 0;
    const inStock = group.in_stock;
    const hasVariants = group.variants.length > 1;

    const visual = firstVariant.image_url
      ? `<img class="product-img" src="${esc(firstVariant.image_url)}" alt="${esc(firstVariant.name)}" loading="lazy">`
      : `<span class="product-icon">${firstVariant.emoji || "🛒"}</span>`;

    const badges = [
      firstVariant.featured ? '<span class="featured-badge">⭐ Featured</span>' : "",
      firstVariant.price <= 20 ? '<span class="price-badge">Value</span>' : ""
    ].join("");

    const variantChips = hasVariants
      ? `<div class="variant-row">${group.variants.map((v, vi) => {
          const vIdx = PRODUCTS.indexOf(v);
          return `<button class="variant-chip${vi === 0 ? " active" : ""}" data-idx="${vIdx}" type="button">₹${v.price}</button>`;
        }).join("")}</div>`
      : "";

    const card = document.createElement("article");
    card.className = "product-card" + (inStock ? "" : " card-oos");
    card.dataset.activeIdx = activeIdx;

    card.innerHTML = `
      <div class="product-visual">
        ${visual}
        ${badges}
        ${inStock ? "" : '<span class="oos-stamp">Out of stock</span>'}
      </div>

      <div class="product-cat">${esc(firstVariant.category)}</div>

      <h3>${esc(group.name)}</h3>

      ${variantChips}

      <div class="product-meta">
        <strong class="price-val">${money(firstVariant.price)}</strong>
        <span class="unit-val">${esc(firstVariant.unit)}</span>
      </div>

      <div class="add-controls">
        ${
          inStock
            ? `
          <div class="qty-box ${qty > 0 ? "visible" : ""}">
            <button class="qty-btn" data-action="dec" data-idx="${activeIdx}" type="button" aria-label="Decrease quantity">−</button>
            <input type="number" class="qty-input" data-idx="${activeIdx}" min="0" step="1" value="${qty || 1}">
            <button class="qty-btn" data-action="inc" data-idx="${activeIdx}" type="button" aria-label="Increase quantity">+</button>
          </div>

          <button class="add-btn" data-idx="${activeIdx}" type="button" ${qty > 0 ? 'style="display:none"' : ""}>+ Add</button>`
            : ""
        }
      </div>
    `;

    grid.appendChild(card);
  });

  empty.hidden = groups.length !== 0;

  syncURLState();
}

function changeQty(index, delta) {
  const next = Math.max(0, (cart[index] || 0) + delta);

  if (next === 0) {
    delete cart[index];
  } else {
    cart[index] = next;
  }

  updateCart();
}

function validateCheckout() {
  const fields = [
    { input: $("c-name"), message: "Please enter your name." },
    { input: $("c-phone"), message: "Please enter your phone number." },
    { input: $("c-place"), message: "Please enter your delivery location." }
  ];

  document.querySelectorAll(".field-error").forEach((el) => el.remove());
  document
    .querySelectorAll(".checkout-fields input")
    .forEach((el) => el.classList.remove("invalid"));

  const invalid = [];

  fields.forEach(({ input, message }) => {
    if (input && !input.value.trim()) {
      input.classList.add("invalid");

      const error = document.createElement("span");
      error.className = "field-error";
      error.textContent = message;
      input.insertAdjacentElement("afterend", error);

      invalid.push(input);
    }
  });

  return invalid;
}

function getCartTotals() {
  let items = 0;
  let total = 0;

  Object.entries(cart).forEach(([idx, qty]) => {
    items += qty;
    total += PRODUCTS[idx].price * qty;
  });

  return { items, total };
}

function updateCart() {
  const { items, total } = getCartTotals();

  $("cart-badge").textContent = items;
  $("cart-badge").style.display = items ? "grid" : "none";

  $("float-count").textContent =
    `${items} item${items === 1 ? "" : "s"}`;

  $("float-total").textContent = money(total);

  $("float-cart").classList.toggle("show", items > 0);

  renderProducts();
  renderCartPanel();
}

function renderCartPanel() {
  const box = $("cart-items-panel");
  const entries = Object.entries(cart);

  if (!entries.length) {
    box.innerHTML = `
      <div class="cart-empty">
        <div>🛒</div>

        <h3>Your cart is empty</h3>

        <p>
          Add products from the shop and they will appear here.
        </p>

        <button
          class="primary-btn"
          data-action="start-shopping"
          type="button"
        >
          Start shopping
        </button>
      </div>
    `;

    $("panel-total").textContent = "₹0";

    return;
  }

  let total = 0;

  box.innerHTML = entries
    .map(([idx, qty]) => {
      const product = PRODUCTS[idx];
      const subtotal = product.price * qty;

      total += subtotal;

      return `
        <div class="cart-item">

          <div class="cart-item-emoji">
            ${product.emoji || "🛒"}
          </div>

          <div class="cart-item-info">

            <strong>${esc(product.name)}</strong>

            <small>
              ${money(product.price)} · ${esc(product.unit)}
            </small>

            <div class="cart-item-qty">

              <button
                class="ci-btn"
                data-action="dec"
                data-idx="${idx}"
                type="button"
                aria-label="Decrease quantity"
              >−</button>

              <span>${qty}</span>

              <button
                class="ci-btn"
                data-action="inc"
                data-idx="${idx}"
                type="button"
                aria-label="Increase quantity"
              >+</button>

            </div>

          </div>

          <strong class="cart-item-subtotal">
            ${money(subtotal)}
          </strong>

        </div>
      `;
    })
    .join("");

  $("panel-total").textContent = money(total);
}

function openCart() {
  renderCartPanel();

  $("cart-overlay").classList.add("open");
  $("cart-overlay").setAttribute("aria-hidden", "false");

  document.body.classList.add("cart-open");

  lastFocused = document.activeElement;
  $("close-cart-btn").focus();
}

function closeCart() {
  $("cart-overlay").classList.remove("open");
  $("cart-overlay").setAttribute("aria-hidden", "true");

  document.body.classList.remove("cart-open");

  if (lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus();
  }
}

function trapCartFocus(event) {
  if (event.key !== "Tab") return;

  const panel = $("cart-overlay");
  const focusables = panel.querySelectorAll(
    'button, input, select, a[href], [tabindex]:not([tabindex="-1"])'
  );

  const list = Array.from(focusables).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );

  if (!list.length) return;

  const first = list[0];
  const last = list[list.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function smoothScroll(id) {
  const el = $(id);

  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ------------------------------------------------------------
// Product loading (Supabase live -> localStorage cache -> fallback)
// ------------------------------------------------------------
async function loadProducts() {
  const note = $("sync-note");
  if (note) note.textContent = "⏳ Syncing products…";

  let fresh = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if (!error && data && data.length) {
        fresh = normalizeProducts(data);
      } else if (error) {
        console.warn("Supabase fetch failed:", error.message);
      }
    } catch (error) {
      console.warn("Supabase fetch failed:", error);
    }
  }

  if (fresh) {
    PRODUCTS = fresh;
    try {
      localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(fresh));
    } catch (error) {
      /* storage unavailable */
    }
  } else {
    const cached = getCachedProducts();
    PRODUCTS = cached.length ? cached : FALLBACK_PRODUCTS;
  }

  refreshUI();

  if (note) note.textContent = "";
}

function refreshUI() {
  buildCategoryTabs();
  renderProducts();
}

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------

// PRODUCT GRID
$("product-grid").addEventListener("click", (event) => {
  const chip = event.target.closest(".variant-chip");
  if (chip) {
    const card = chip.closest(".product-card");
    const idx = Number(chip.dataset.idx);
    const product = PRODUCTS[idx];

    card.querySelectorAll(".variant-chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");

    card.dataset.activeIdx = idx;
    card.querySelector(".price-val").textContent = money(product.price);
    card.querySelector(".unit-val").textContent = product.unit || "";

    card.querySelectorAll(".qty-btn, .qty-input, .add-btn").forEach((el) => {
      el.dataset.idx = idx;
    });

    const qty = cart[idx] || 0;
    const qtyBox = card.querySelector(".qty-box");
    const addBtn = card.querySelector(".add-btn");
    if (qtyBox) qtyBox.classList.toggle("visible", qty > 0);
    if (addBtn) addBtn.style.display = qty > 0 ? "none" : "";
    const input = card.querySelector(".qty-input");
    if (input) input.value = qty || 1;

    return;
  }

  const addBtn = event.target.closest(".add-btn");
  if (addBtn) {
    const idx = Number(addBtn.dataset.idx);
    const card = addBtn.closest(".product-card");
    const input = card ? card.querySelector(".qty-input") : null;
    const qty = input ? Math.max(1, Number(input.value) || 1) : 1;

    setQty(idx, qty);
    showToast(`${PRODUCTS[idx].name} added to cart`);
    return;
  }

  const btn = event.target.closest(".qty-btn");
  if (btn) {
    const idx = Number(btn.dataset.idx);
    const card = btn.closest(".product-card");
    const input = card ? card.querySelector(".qty-input") : null;
    const current = input ? Number(input.value) || 0 : (cart[idx] || 0);
    const next = Math.max(0, current + (btn.dataset.action === "dec" ? -1 : 1));

    if (input) input.value = next || 1;
    setQty(idx, next);

    if (card) {
      const qtyBox = card.querySelector(".qty-box");
      const addBtnEl = card.querySelector(".add-btn");
      if (qtyBox) qtyBox.classList.toggle("visible", next > 0);
      if (addBtnEl) addBtnEl.style.display = next > 0 ? "none" : "";
    }

    return;
  }
});

$("product-grid").addEventListener("change", (event) => {
  const input = event.target.closest(".qty-input");
  if (!input) return;

  const idx = Number(input.dataset.idx);
  const val = Math.max(0, Number(input.value) || 0);
  input.value = val || 1;
  setQty(idx, val);

  const card = input.closest(".product-card");
  if (card) {
    const qtyBox = card.querySelector(".qty-box");
    const addBtn = card.querySelector(".add-btn");
    if (qtyBox) qtyBox.classList.toggle("visible", val > 0);
    if (addBtn) addBtn.style.display = val > 0 ? "none" : "";
  }
});

// CART
$("cart-items-panel").addEventListener("click", (event) => {
  const start = event.target.closest("[data-action='start-shopping']");

  if (start) {
    closeCart();
    smoothScroll("shop");
    return;
  }

  const btn = event.target.closest("[data-idx]");

  if (!btn) return;

  changeQty(
    Number(btn.dataset.idx),
    btn.dataset.action === "inc" ? 1 : -1
  );
});

// CATEGORIES
$("cat-bar").addEventListener("click", (event) => {
  const tab = event.target.closest(".cat-tab");

  if (!tab) return;

  document
    .querySelectorAll(".cat-tab")
    .forEach((t) => t.classList.remove("active"));

  tab.classList.add("active");

  activeCategory = tab.dataset.cat;
  quickFilter = null;

  renderProducts();

  smoothScroll("shop");
});

// SEARCH
$("search-input").addEventListener("input", renderProducts);

$("clear-search").addEventListener("click", () => {
  $("search-input").value = "";
  renderProducts();
  $("search-input").focus();
});

// SORT
$("sort-select").addEventListener("change", (event) => {
  sortBy = event.target.value;
  renderProducts();
});

// QUICK FILTERS
document
  .querySelectorAll("[data-quick]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.quick;

      quickFilter = type === "all" ? null : type;

      if (type === "all") {
        activeCategory = "All";

        document
          .querySelectorAll(".cat-tab")
          .forEach((t) => {
            t.classList.toggle("active", t.dataset.cat === "All");
          });
      }

      renderProducts();
    });
  });

// RESET FILTERS
$("reset-filters").addEventListener("click", () => {
  activeCategory = "All";
  quickFilter = null;
  sortBy = "default";

  $("search-input").value = "";
  $("sort-select").value = "default";

  document
    .querySelectorAll(".cat-tab")
    .forEach((t) => {
      t.classList.toggle("active", t.dataset.cat === "All");
    });

  renderProducts();
});

// SHOP NOW
$("shop-now").addEventListener("click", () => {
  smoothScroll("shop");
});

// CART OPEN/CLOSE
$("open-cart-btn").addEventListener("click", openCart);
$("close-cart-btn").addEventListener("click", closeCart);
$("overlay-bg").addEventListener("click", closeCart);
$("float-cart").addEventListener("click", openCart);
$("cart-overlay").addEventListener("keydown", trapCartFocus);

document
  .querySelectorAll(".checkout-fields input")
  .forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("invalid");

      const error = input.nextElementSibling;

      if (error && error.classList.contains("field-error")) {
        error.remove();
      }
    });
  });

// ESCAPE KEY
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
  }
});

// CLEAR CART
$("clear-btn").addEventListener("click", () => {
  if (!Object.keys(cart).length) {
    showToast("Cart is already empty");
    return;
  }

  if (!window.confirm("Clear your cart?")) return;

  Object.keys(cart).forEach((key) => {
    delete cart[key];
  });

  updateCart();
  showToast("Cart cleared");
});

// WHATSAPP ORDER
$("wa-order-btn").addEventListener("click", () => {
  const { items, total } = getCartTotals();

  if (!items) {
    showToast("Please add at least one product.");
    return;
  }

  const invalid = validateCheckout();

  if (invalid.length) {
    invalid[0].focus();
    showToast("Please fix the highlighted fields.");
    return;
  }

  const name = $("c-name").value.trim();
  const phone = $("c-phone").value.trim();
  const place = $("c-place").value.trim();

  const lines = Object.entries(cart).map(([idx, qty]) => {
    const product = PRODUCTS[idx];
    return `• ${product.name} × ${qty} = ${money(product.price * qty)}`;
  });

  const message =
    `New Order – Kalaivani Stores\n\n` +
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    `Delivery: ${place}\n\n` +
    `Items:\n` +
    `${lines.join("\n")}\n\n` +
    `Total: ${money(total)}\n\n` +
    `Please confirm this order. Thank you!`;

  const whatsappURL =
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, "_blank");

  showToast("Opening WhatsApp…");
});

// ------------------------------------------------------------
// INITIAL LOAD
// ------------------------------------------------------------
applyURLState();
refreshUI();
updateCart();
loadProducts();
