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
        ? product.price != null && product.price <= 50
        : quickFilter === "popular"
          ? product.price != null && product.price <= 100
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
    const qty = cart[activeIdx] || 0;
    const inStock = group.in_stock;
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
          return `<button class="variant-chip${vi === 0 ? " active" : ""}" data-idx="${vIdx}" type="button">${esc(label)}</button>`;
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
        <strong class="price-val">${hasPrice ? money(firstVariant.price) : "Price soon"}</strong>
        <span class="unit-val">${hasPrice ? esc(firstVariant.unit) : ""}</span>
      </div>

      ${weight ? '<div class="anyqty-tag">⚖️ Pick any amount</div>' : ""}

      <div class="add-controls">
        ${
          inStock && hasPrice
            ? `
          <div class="qty-box ${weight || qty > 0 ? "visible" : ""}">
            <button class="qty-btn" data-action="dec" data-idx="${activeIdx}" type="button" aria-label="Decrease quantity">−</button>
            <div class="qty-field">
              <input type="number" inputmode="decimal" class="qty-input" data-idx="${activeIdx}" min="0" step="1" value="${qty || 1}">
              <span class="qty-unit" hidden></span>
            </div>
            <button class="qty-btn" data-action="inc" data-idx="${activeIdx}" type="button" aria-label="Increase quantity">+</button>
          </div>

          <p class="qty-total" ${weight ? "" : "hidden"}></p>

          <button class="add-btn" data-idx="${activeIdx}" type="button" ${qty > 0 ? 'style="display:none"' : ""}>${weight ? `Add ${fmtQty(qty || 1)} kg` : "+ Add"}</button>`
            : ""
        }
      </div>
    `;

    grid.appendChild(card);

    syncCardControls(card, activeIdx);
  });

  empty.hidden = groups.length !== 0;

  syncURLState();
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

  const rawItems = Object.values(cart).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const count = roundQty(rawItems);
  const { total } = getCartTotals(cart, PRODUCTS);

  const badge = $("cart-badge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = rawItems ? "grid" : "none";
  }

  const floatCart = $("float-cart");
  if (floatCart) {
    const countEl = $("float-count");
    const totalEl = $("float-total");
    if (countEl) countEl.textContent = `${count} item${count === 1 ? "" : "s"}`;
    if (totalEl) totalEl.textContent = money(total);
    floatCart.classList.toggle("show", rawItems > 0);
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
    PRODUCTS = cached.length ? cached : FALLBACK_PRODUCTS;
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
    card.querySelector(".price-val").textContent = money(product.price);
    card.querySelector(".unit-val").textContent = product.unit || "";

    card.querySelectorAll(".qty-btn, .qty-input, .add-btn").forEach((el) => {
      el.dataset.idx = idx;
    });

    const qty = cart[idx] || 0;
    const weight = isWeightUnit(product.unit);
    const qtyBox = card.querySelector(".qty-box");
    const addBtn = card.querySelector(".add-btn");
    if (qtyBox) qtyBox.classList.toggle("visible", weight || qty > 0);
    if (addBtn) addBtn.style.display = qty > 0 ? "none" : "";
    const input = card.querySelector(".qty-input");
    if (input) input.value = qty || 1;

    syncCardControls(card, idx);

    return;
  }

  const addBtn = event.target.closest(".add-btn");
  if (addBtn) {
    const idx = Number(addBtn.dataset.idx);
    const product = PRODUCTS[idx];
    if (!product) return;
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
    const card = btn.closest(".product-card");
    const input = card ? card.querySelector(".qty-input") : null;
    const current = input ? Number(input.value) || 0 : (cart[idx] || 0);
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
  const val = Math.max(0, roundQty(Number(input.value) || 0));
  input.value = val || 1;
  setQty(idx, val);

  const card = input.closest(".product-card");
  if (card) {
    const qtyBox = card.querySelector(".qty-box");
    const addBtn = card.querySelector(".add-btn");
    const product = PRODUCTS[idx];
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
// AUTH GATE & INITIAL LOAD
// ------------------------------------------------------------
// The whole store is behind a sign-in wall. If there's no session we
// send the visitor to login.html and bring them back when they're in.
function redirectToLogin() {
  const url = new URL("login.html", window.location.href);
  url.searchParams.set(
    "next",
    window.location.pathname + window.location.search + window.location.hash
  );
  window.location.replace(url.toString());
}

async function requireAuth() {
  if (!supabaseClient) {
    redirectToLogin();
    return false;
  }
  const session = await getSessionReady(supabaseClient);
  if (session) return true;
  redirectToLogin();
  return false;
}

(function bootStore() {
  const gate = document.createElement("div");
  gate.id = "auth-gate";
  gate.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:#f5f7f2;display:flex;" +
    "align-items:center;justify-content:center;";
  gate.setAttribute("aria-hidden", "true");
  document.body.appendChild(gate);

  async function start() {
    const ok = await requireAuth();
    gate.remove();
    if (!ok) return;

    applyURLState();
    refreshUI();
    updateCart();
    loadProducts();

    if (!window._ksClosedChecked) {
      window._ksClosedChecked = true;
      checkShopStatus(supabaseClient);
    }

    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" && !session) {
          window.location.replace(
            new URL("login.html", window.location.href).href
          );
        }
      });
    }
  }

  start();
})();
