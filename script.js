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
    supabaseClient = ksSupabaseClient();
  }
} catch (error) {
  console.warn("Supabase init failed:", error);
}

// --- Fallback catalog (used offline / while Supabase is empty) ---
// Rows go through normalizeProducts() so they get the same stable
// cart `key` as live DB rows.
const FALLBACK_PRODUCTS = normalizeProducts([
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
})));

const CATEGORY_EMOJIS = {
  All: "✨",
  Snacks: "🍪",
  Beverages: "🥤",
  Dairy: "🥛",
  Groceries: "🍚",
  "Quick meals": "🍜",
  Vegetables: "🥦",
  "Bath & Body": "🧴",
  "Home Cleaning": "🧹",
  Stationery: "📚"
};

const CATEGORY_ORDER = [
  "Snacks",
  "Beverages",
  "Dairy",
  "Groceries",
  "Vegetables",
  "Quick meals",
  "Bath & Body",
  "Home Cleaning",
  "Stationery"
];

const cart = loadCart();
let PRODUCTS = [];
let activeCategory = "All";
let quickFilter = null;
let sortBy = "default";

const $ = (id) => document.getElementById(id);

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
        variants: []
      };
    }
    groups[key].variants.push(p);
  });
  return Object.values(groups);
}

function setQty(index, qty) {
  const product = PRODUCTS[index];
  if (!product || product.in_stock === false) return;
  qty = Math.max(0, Number(qty) || 0);
  if (qty === 0) {
    delete cart[product.key];
  } else {
    cart[product.key] = qty;
  }
  updateCart();
}

// Cart quantity for the product at `index` (resolved by stable key).
function qtyAt(index) {
  const product = PRODUCTS[index];
  return product ? Number(cart[product.key]) || 0 : 0;
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

function productMatches(product, query) {
  if (!query) return true;

  const text =
    `${product.name} ${product.category} ${product.unit || ""}`.toLowerCase();

  return text.includes(query.toLowerCase());
}

function getFilteredProducts() {
  const query = $("search-input").value.trim();

  // "Popular" = admin-featured products. If the admin hasn't featured
  // anything yet, fall back to a cheap-and-cheerful under-₹100 list
  // rather than showing an empty section.
  const anyFeatured = PRODUCTS.some((p) => p.featured === true);

  let products = PRODUCTS.filter((product) => {
    const categoryOK =
      activeCategory === "All" || normalizeCat(product.category) === activeCategory;

    const searchOK = productMatches(product, query);

    const quickOK =
      quickFilter === "under50"
        ? product.price != null && product.price <= 50
        : quickFilter === "popular"
          ? anyFeatured
            ? product.featured === true
            : product.price != null && product.price <= 100
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
  const cats = new Set(PRODUCTS.map((p) => normalizeCat(p.category)).filter(Boolean));
  const categories = [
    ...CATEGORY_ORDER.filter((c) => cats.has(c)),
    ...[...cats].filter((c) => !CATEGORY_ORDER.includes(c))
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
    const qty = qtyAt(activeIdx);
    const groupStocked = group.variants.some((v) => v.in_stock !== false);
    const hasVariants = group.variants.length > 1;
    const hasPrice = firstVariant.price != null;
    const weight = !!(firstVariant.unit && isWeightUnit(firstVariant.unit));

    const emojiFallback = `<span class="product-icon"${firstVariant.image_url ? ' style="display:none"' : ""}>${firstVariant.emoji || "🛒"}</span>`;
    const visual = firstVariant.image_url
      ? `<img class="product-img" src="${esc(firstVariant.image_url)}" alt="${esc(firstVariant.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${emojiFallback}`
      : emojiFallback;

    const badges = [
      firstVariant.featured ? '<span class="featured-badge">⭐ Featured</span>' : "",
      firstVariant.price != null && firstVariant.price <= 20 ? '<span class="price-badge">Value</span>' : ""
    ].join("");

    const variantChips = hasVariants
      ? `<div class="variant-row">${group.variants.map((v, vi) => {
          const vIdx = PRODUCTS.indexOf(v);
          const diff = v.name.replace(group.name, "").trim();
          let label;
          if (diff) {
            label = diff.replace(/^\(|\)$/g, "").trim();
            label = label.charAt(0).toUpperCase() + label.slice(1);
          } else if (v.price != null) {
            label = "₹" + v.price;
          } else {
            label = "price soon";
          }
          return `<button class="variant-chip${vi === 0 ? " active" : ""}${v.in_stock === false ? " out" : ""}" data-idx="${vIdx}" type="button">${esc(label)}${v.in_stock === false ? '<em class="chip-oos">out</em>' : ""}</button>`;
        }).join("")}</div>`
      : "";

    const card = document.createElement("article");
    card.className = "product-card" + (groupStocked ? "" : " card-oos");
    card.dataset.activeIdx = activeIdx;

    card.innerHTML = `
      <div class="product-visual">
        ${visual}
        ${badges}
      </div>

      <div class="product-cat">${esc(firstVariant.category)}</div>

      <h3>${esc(group.name)}</h3>

      ${variantChips}

      <div class="product-meta">
        <strong class="price-val">${hasPrice ? money(firstVariant.price) : "Price soon"}</strong>
        <span class="unit-val">${hasPrice ? esc(firstVariant.unit) : ""}</span>
      </div>

      ${weight ? '<div class="anyqty-tag">⚖️ Pick any amount</div>' : ""}

      <div class="add-controls">
        ${variantControlsHtml(activeIdx, qty, weight)}
      </div>
    `;

    grid.appendChild(card);

    applyVariantOos(card, activeIdx);
    syncCardControls(card, activeIdx);
  });

  empty.hidden = groups.length !== 0;

  syncURLState();
}

// Builds the buy area for one variant: quantity controls when the
// variant is in stock, or a "sold out" marker when it isn't.
function variantControlsHtml(idx, qty, weight) {
  const product = PRODUCTS[idx];
  if (!product || product.in_stock === false) {
    return '<div class="soldout-chip">Out of stock</div>';
  }
  if (product.price == null) {
    return '<div class="soldout-chip">Price soon</div>';
  }
  return `
    <div class="qty-box ${weight || qty > 0 ? "visible" : ""}">
      <button class="qty-btn" data-action="dec" data-idx="${idx}" type="button" aria-label="Decrease quantity">−</button>
      <div class="qty-field">
        <input type="number" inputmode="decimal" class="qty-input" data-idx="${idx}" min="0" step="1" value="${qty || 1}">
        <span class="qty-unit" hidden></span>
      </div>
      <button class="qty-btn" data-action="inc" data-idx="${idx}" type="button" aria-label="Increase quantity">+</button>
    </div>

    <p class="qty-total" ${weight ? "" : "hidden"}></p>

    <button class="add-btn" data-idx="${idx}" type="button" ${qty > 0 ? 'style="display:none"' : ""}>${weight ? `Add ${fmtQty(qty || 1)} kg` : "+ Add"}</button>`;
}

// Blurs the visual and stamps "Out of stock" when the currently
// selected variant is sold out; restores it when switching back.
function applyVariantOos(card, idx) {
  const product = PRODUCTS[idx];
  const oos = !product || product.in_stock === false;
  card.classList.toggle("active-oos", oos);
  let stamp = card.querySelector(".oos-stamp");
  if (oos && !stamp) {
    const visual = card.querySelector(".product-visual");
    if (visual) {
      const el = document.createElement("span");
      el.className = "oos-stamp";
      el.textContent = "Out of stock";
      visual.appendChild(el);
    }
  } else if (!oos && stamp) {
    stamp.remove();
  }
}

function syncCardControls(card, idx) {
  const product = PRODUCTS[idx];
  const weight = !!(product && isWeightUnit(product.unit));
  const input = card.querySelector(".qty-input");
  const unitEl = card.querySelector(".qty-unit");
  const totalEl = card.querySelector(".qty-total");

  if (input) {
    input.step = weight ? "0.25" : "1";
    input.dataset.idx = idx;
  }
  if (unitEl) {
    unitEl.textContent = weight ? "kg" : "";
    unitEl.hidden = !weight;
  }
  if (totalEl) totalEl.hidden = !weight;

  card.classList.toggle("card-weight", weight);
  updateQtyTotal(card, idx);
}

function updateQtyTotal(card, idx) {
  const product = PRODUCTS[idx];
  const totalEl = card.querySelector(".qty-total");
  const input = card.querySelector(".qty-input");
  if (!totalEl || !product || !isWeightUnit(product.unit)) return;

  const qty = roundQty(input ? input.value : 0);
  const price = product.price;
  const total = price == null ? null : roundQty(qty * price);

  totalEl.textContent =
    `${fmtQty(qty)} kg × ${price == null ? "—" : money(price)}` +
    (total == null ? "" : ` = ${money(total)}`);

  const addBtn = card.querySelector(".add-btn");
  if (addBtn && addBtn.style.display !== "none") {
    addBtn.textContent = `Add ${fmtQty(qty) || 1} kg`;
  }
}

function updateCart() {
  saveCart(cart);

  // Only count entries that resolve to a real product, so the badge
  // always matches what the cart page will actually show.
  const { items, total } = getCartTotals(cart, PRODUCTS);
  const count = roundQty(items);

  const badge = $("cart-badge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = items ? "grid" : "none";
  }

  const floatCart = $("float-cart");
  if (floatCart) {
    const countEl = $("float-count");
    const totalEl = $("float-total");
    if (countEl) countEl.textContent = `${count} item${count === 1 ? "" : "s"}`;
    if (totalEl) totalEl.textContent = money(total);
    floatCart.classList.toggle("show", items > 0);
  }

  renderProducts();
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
      let { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });

      if ((error && String(error.message).includes("id does not exist")) || (error && error.code === "42703")) {
        const retry = await supabaseClient
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true, nullsFirst: false });
        data = retry.data;
        error = retry.error;
      }

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
    if (cached.length) {
      PRODUCTS = cached;
    } else {
      PRODUCTS = FALLBACK_PRODUCTS;
      // The hardcoded fallback is NOT the list legacy index-keyed carts
      // were built from — migrating against it could pick wrong items,
      // so leave old carts untouched until a real catalog loads.
      if (note) note.textContent = "";
      refreshUI();
      updateCart();
      return;
    }
  }

  // One-time upgrade: carts saved by older versions were keyed by array
  // index; re-key them to stable product ids so admin edits can't swap
  // items in a shopper's cart.
  if (migrateCartKeys(cart, PRODUCTS, true)) {
    saveCart(cart);
  }

  refreshUI();
  updateCart();

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
    card.querySelector(".price-val").textContent =
      product.price == null ? "Price soon" : money(product.price);
    card.querySelector(".unit-val").textContent = product.unit || "";

    const qty = qtyAt(idx);
    const weight = isWeightUnit(product.unit);
    const controls = card.querySelector(".add-controls");
    if (controls) controls.innerHTML = variantControlsHtml(idx, qty, weight);

    applyVariantOos(card, idx);
    syncCardControls(card, idx);

    return;
  }

  const addBtn = event.target.closest(".add-btn");
  if (addBtn) {
    const idx = Number(addBtn.dataset.idx);
    const product = PRODUCTS[idx];
    if (!product || product.in_stock === false) return;
    const card = addBtn.closest(".product-card");
    const input = card ? card.querySelector(".qty-input") : null;
    const weight = isWeightUnit(product.unit);
    const raw = input ? Number(input.value) : 0;
    const qty = weight
      ? Math.max(0.25, roundQty(raw))
      : Math.max(1, raw || 1);

    setQty(idx, qty);
    showToast(`${product.name} added to cart`);
    return;
  }

  const btn = event.target.closest(".qty-btn");
  if (btn) {
    const idx = Number(btn.dataset.idx);
    const product = PRODUCTS[idx];
    if (!product || product.in_stock === false) return;
    const card = btn.closest(".product-card");
    const input = card ? card.querySelector(".qty-input") : null;
    const current = input ? Number(input.value) || 0 : qtyAt(idx);
    const weight = !!(product && isWeightUnit(product.unit));
    const step = weight ? 0.5 : 1;
    const delta = btn.dataset.action === "dec" ? -step : step;
    const next = Math.max(0, weight ? roundQty(current + delta) : Math.round(current + delta));

    if (input) input.value = next || 1;
    setQty(idx, next);

    if (card) {
      const qtyBox = card.querySelector(".qty-box");
      const addBtnEl = card.querySelector(".add-btn");
      if (qtyBox) qtyBox.classList.toggle("visible", weight || next > 0);
      if (addBtnEl) addBtnEl.style.display = next > 0 ? "none" : "";
      updateQtyTotal(card, idx);
    }

    return;
  }
});

$("product-grid").addEventListener("change", (event) => {
  const input = event.target.closest(".qty-input");
  if (!input) return;

  const idx = Number(input.dataset.idx);
  const product = PRODUCTS[idx];
  if (!product || product.in_stock === false) return;
  const val = Math.max(0, roundQty(Number(input.value) || 0));
  input.value = val || 1;
  setQty(idx, val);

  const card = input.closest(".product-card");
  if (card) {
    const qtyBox = card.querySelector(".qty-box");
    const addBtn = card.querySelector(".add-btn");
    const weight = !!(product && isWeightUnit(product.unit));
    if (qtyBox) qtyBox.classList.toggle("visible", weight || val > 0);
    if (addBtn) addBtn.style.display = val > 0 ? "none" : "";
    updateQtyTotal(card, idx);
  }
});

$("product-grid").addEventListener("input", (event) => {
  const input = event.target.closest(".qty-input");
  if (!input) return;
  const card = input.closest(".product-card");
  if (card) updateQtyTotal(card, Number(input.dataset.idx));
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
            t.classList.remove("active");
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
      t.classList.remove("active");
    });

  renderProducts();
});

// SHOP NOW
$("shop-now").addEventListener("click", () => {
  smoothScroll("shop");
});

// ------------------------------------------------------------
// AUTH & INITIAL LOAD
// ------------------------------------------------------------
// Browsing is public (so customers and search engines can see the
// store). Sign-in is only required to place an order, view orders or
// edit a profile — those pages each enforce it themselves.
async function getCurrentUser() {
  if (!supabaseClient) return null;
  try {
    const session = await getSessionReady(supabaseClient);
    return session ? session.user : null;
  } catch (error) {
    return null;
  }
}

// Left slide-in drawer (☰, before the logo). Members get Profile /
// My Orders / Sign out; guests get Sign in / My Orders. No Settings.
function renderAuthAction(user) {
  const nav = document.getElementById("drawer-nav");
  if (!nav) return;
  nav.innerHTML = "";

  const addLink = (href, icon, label) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "nav-item";
    a.innerHTML = icon + " <span>" + label + "</span>";
    nav.appendChild(a);
    return a;
  };

  if (user) {
    addLink("profile.html", "👤", "Profile");
    addLink("orders.html", "📦", "My Orders");

    const itemLogout = document.createElement("button");
    itemLogout.type = "button";
    itemLogout.className = "nav-item nav-item-logout";
    itemLogout.innerHTML = "🚪 <span>Sign out</span>";
    itemLogout.addEventListener("click", async () => {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        /* ignore — we reload either way */
      }
      window.location.replace("index.html");
    });
    nav.appendChild(itemLogout);
  } else {
    addLink(
      "login.html?next=" +
        encodeURIComponent(window.location.pathname + window.location.search),
      "🔑", "Sign in"
    );
    addLink("orders.html", "📦", "My Orders");
  }

  // Followed a link → close the drawer.
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", closeNavDrawer)
  );
}

// --- drawer open/close (wired once per page load) ---
function closeNavDrawer() {
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("nav-backdrop");
  const toggle = document.getElementById("nav-toggle");
  if (!drawer) return;
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  document.body.classList.remove("nav-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open menu");
}

function initNavDrawer() {
  const toggle = document.getElementById("nav-toggle");
  const drawer = document.getElementById("nav-drawer");
  const backdrop = document.getElementById("nav-backdrop");
  const closeBtn = document.getElementById("nav-close");
  if (!toggle || !drawer) return;

  toggle.addEventListener("click", () => {
    const open = !drawer.classList.contains("open");
    drawer.classList.toggle("open", open);
    if (backdrop) backdrop.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  if (closeBtn) closeBtn.addEventListener("click", closeNavDrawer);
  if (backdrop) backdrop.addEventListener("click", closeNavDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavDrawer();
  });
}

(function bootStore() {
  async function start() {
    applyURLState();
    refreshUI();
    updateCart();
    loadProducts();

    const user = await getCurrentUser();
    renderAuthAction(user);
    initNavDrawer();

    if (supabaseClient) {
      try {
        const settings = await fetchShopSettings(supabaseClient);
        if (settings) {
          if (settings.shop_open === false) {
            showClosedPanel(settings.message);
          }
          renderAnnouncement(settings.announcement);
        }
      } catch (error) {
        /* settings unavailable — treat the shop as open */
      }

      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          renderAuthAction(session ? session.user : null);
        }
      });
    }
  }

  start();
})();

function showClosedPanel(message) {
  const grid = document.getElementById("product-grid");
  if (!grid || document.getElementById("closed-panel")) return;
  const msg =
    (message && String(message).trim()) ||
    "We're temporarily closed. Please check back soon.";
  grid.hidden = true;

  // Hide the filter/sort/search chrome too — filtering a shop that
  // can't be ordered from is just confusing.
  document.body.classList.add("shop-closed");
  document.querySelectorAll(".quick-links").forEach((el) => {
    el.hidden = true;
  });
  const tools = document.querySelector(".section-tools");
  if (tools) tools.hidden = true;
  const catWrap = document.querySelector(".category-wrap");
  if (catWrap) catWrap.hidden = true;

  const panel = document.createElement("section");
  panel.id = "closed-panel";
  panel.className = "closed-panel";
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML =
    '<span class="closed-ico" aria-hidden="true">&#128336;</span>' +
    '<span class="closed-brand">Kalaivani Stores</span>' +
    '<h2 class="closed-title">Temporarily Closed</h2>' +
    '<p class="closed-msg">' + esc(msg) + "</p>" +
    '<p class="closed-sub">We\'ll be back soon &mdash; please check back a little later.</p>';
  grid.insertAdjacentElement("beforebegin", panel);
}

// Admin-editable announcement bar (settings.announcement). Empty keeps
// the default marquee text already in index.html.
function renderAnnouncement(text) {
  const value = (text && String(text).trim()) || "";
  if (!value) return;
  const parts = value.split(/\s*[|·]\s*|\s*\n\s*/).filter(Boolean);
  if (!parts.length) return;
  const html = parts
    .map((line) => `${esc(line)} <i>✦</i> `)
    .join("");
  document.querySelectorAll(".announcement-msg").forEach((el, i) => {
    el.innerHTML = html;
    if (i === 1) el.setAttribute("aria-hidden", "true");
  });
}
