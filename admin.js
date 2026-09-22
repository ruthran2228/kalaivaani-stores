// ============================================================
// Kalaivani Stores — Admin page
// Auth + dashboard + products CRUD + bulk pricing + orders
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

// --- State ---
let PRODUCTS = [];
let ORDERS = [];
let currentTab = "dashboard";
let filters = { search: "", category: "all", stock: "all", price: "all" };

// --- Helpers ---
const $ = (sel) => document.querySelector(sel);
const money = (n) => "₹" + Number(n || 0);

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstDayLocal(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// --- Toast ---
let toastTimer = null;
function showToast(message) {
  let toast = $(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function init() {
  if (!supabaseClient) {
    showLoginError("Supabase not configured. Make sure config.js is present.");
    return;
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") window.location.reload();
  });

  supabaseClient.auth
    .getSession()
    .then(({ data }) => {
      if (data.session) {
        AUTH = data.session;
        bootAdmin();
      } else {
        showLogin();
      }
    })
    .catch(() => showLogin());
}

let AUTH = null;

function showLogin() {
  const app = $("#app");
  if (app) app.hidden = true;
  $("#auth-screen").hidden = false;
}

function showLoginError(message) {
  const err = $("#login-error");
  err.textContent = message;
  err.hidden = false;
}

async function handleLogin(event) {
  event.preventDefault();
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const btn = $("#login-btn");

  if (!email || !password) {
    showLoginError("Enter your email and password.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Signing in…";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  btn.disabled = false;
  btn.textContent = "Sign in";

  if (error) {
    showLoginError(error.message);
    showEmailConfirmHelp(error);
    return;
  }

  AUTH = data.session;
  bootAdmin();
}

function showEmailConfirmHelp(error) {
  const msg = String(error.code + " " + error.message).toLowerCase();
  const hint = document.getElementById("login-hint");
  if (!hint) return;

  if (msg.includes("email not confirmed")) {
    hint.innerHTML =
      "Your email has not been confirmed yet. In <strong>Supabase &rarr; Authentication &rarr; Users</strong>, " +
      "click the <strong>&hellip;</strong> for your user and choose <strong>Confirm email</strong>. " +
      "Then sign in again.";
    hint.hidden = false;
    return;
  }

  if (msg.includes("invalid login")) {
    hint.innerHTML =
      "No account with this password. Create your admin user first in " +
      "<strong>Supabase &rarr; Authentication &rarr; Users &rarr; Add user</strong> (add to <code>admin_users</code> too), " +
      "or reset the password.";
    hint.hidden = false;
  }
}

async function bootAdmin() {
  let admin = false;
  try {
    const { data, error } = await supabaseClient.rpc("is_admin");
    if (!error) admin = !!data;
    else if (String(error.message).includes("Could not find the function"))
      admin = null; // SQL not applied yet
  } catch (e) {
    admin = null;
  }

  if (admin === false) {
    showLoginError("This account is not an admin.");
    await supabaseClient.auth.signOut();
    return;
  }

  $("#auth-screen").hidden = true;
  $("#app").hidden = false;

  if (admin === null) {
    showToast("Admin setup SQL not applied yet. See admin_setup.sql.");
  }

  buildShell();
  await refreshData();
  subscribeOrderUpdates();
}

// Realtime: refresh the orders list the moment a customer places an order
function subscribeOrderUpdates() {
  if (!supabaseClient) return;

  const channel = supabaseClient
    .channel("orders-live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      () => refreshOrders("🛒 New order received!")
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") console.log("Live orders: connected");
      if (err) console.warn("Live orders: subscribe error", err);
    });
}

async function refreshOrders(toastMsg) {
  await loadOrders();
  updateTabCounts();
  if (currentTab === "dashboard") renderDashboard();
  if (currentTab === "orders") renderOrdersPanel();
  if (toastMsg) showToast(toastMsg);
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

// ------------------------------------------------------------
// Shell + navigation
// ------------------------------------------------------------
function buildShell() {
  const app = $("#app");

  const categories = uniqueCategories(PRODUCTS);

  app.innerHTML = `
    <div class="app-top">
      <span class="logo-mark">KS</span>
      <h1>Kalaivani Stores<small> &nbsp; admin</small></h1>
      <div class="spacer"></div>
      <a class="btn" href="./" target="_blank">Open store</a>
      <div class="user-chip">
        <span>${esc((AUTH && AUTH.user && AUTH.user.email) || "Admin")}</span>
        <button class="btn" id="logout-btn" type="button">Log out</button>
      </div>
    </div>

    <nav class="tabs" id="tabs">
      <button class="tab active" data-tab="dashboard" type="button">Dashboard</button>
      <button class="tab" data-tab="products" type="button">Products<span class="count" id="tab-products-count"></span></button>
      <button class="tab" data-tab="orders" type="button">Orders<span class="count" id="tab-orders-count"></span></button>
    </nav>

    <main class="page">
      <section class="page-panel active" id="panel-dashboard"></section>
      <section class="page-panel" id="panel-products"></section>
      <section class="page-panel" id="panel-orders"></section>
    </main>
  `;

  $("#logout-btn").addEventListener("click", handleLogout);
  $("#tabs").addEventListener("click", (ev) => {
    const tab = ev.target.closest("[data-tab]");
    if (tab) switchTab(tab.dataset.tab);
  });
}

function uniqueCategories(products) {
  const map = new Map();
  products.forEach((p) => {
    const c = p.category || "Uncategorised";
    map.set(c, (map.get(c) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  document.querySelectorAll(".page-panel").forEach((el) => {
    el.classList.toggle("active", el.id === "panel-" + tab);
  });

  if (tab === "dashboard") renderDashboard();
  if (tab === "products") renderProductsPanel();
  if (tab === "orders") renderOrdersPanel();
}

// ------------------------------------------------------------
// Data loading
// ------------------------------------------------------------
async function refreshData() {
  await loadProducts();
  await loadOrders();
  updateTabCounts();
  switchTab(currentTab);
}

async function loadProducts() {
  const panel = $("#panel-" + currentTab);
  if (panel) panel.innerHTML = `<div class="skeleton">Loading products…</div>`;

  let { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  // Defensive retry if the table was recreated without the id column
  if (
    error &&
    (String(error.message).includes("id does not exist") || error.code === "42703")
  ) {
    const retry = await supabaseClient
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("loadProducts error", error);
    PRODUCTS = [];
    return;
  }

  PRODUCTS = data || [];
}

async function loadOrders() {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadOrders error", error);
    ORDERS = [];
    return;
  }

  ORDERS = data || [];
}

function updateTabCounts() {
  const pc = $("#tab-products-count");
  const oc = $("#tab-orders-count");
  if (pc) pc.textContent = PRODUCTS.length;
  if (oc) oc.textContent = ORDERS.length;
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
function renderDashboard() {
  const panel = $("#panel-dashboard");
  if (!panel) return;

  const outOfStock = PRODUCTS.filter((p) => !p.in_stock).length;
  const noPrice = PRODUCTS.filter((p) => !p.price && p.price !== 0).length;
  const featured = PRODUCTS.filter((p) => p.featured).length;

  const todayStart = firstDayLocal(Date.now());
  const ordersToday = ORDERS.filter((o) => firstDayLocal(o.created_at) === todayStart).length;
  const pendingOrders = ORDERS.filter((o) => o.status === "new").length;

  const categories = uniqueCategories(PRODUCTS);
  const catRows = categories
    .map(
      ([cat, count]) =>
        `<span class="chip">${esc(cat)} · ${count}</span>`
    )
    .join("");

  const recent = ORDERS.slice(0, 6);

  panel.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Dashboard</h2>
        <p>Current picture of the store.</p>
      </div>
      <button class="btn btn-green" id="dash-manage" type="button">Manage products</button>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total products</div>
        <div class="stat-value">${PRODUCTS.length}</div>
        <div class="stat-sub">${featured} featured</div>
      </div>
      <div class="stat-card warn">
        <div class="stat-label">Missing price</div>
        <div class="stat-value">${noPrice}</div>
        <div class="stat-sub">Needs your attention</div>
      </div>
      <div class="stat-card ${outOfStock ? "danger" : "ok"}">
        <div class="stat-label">Out of stock</div>
        <div class="stat-value">${outOfStock}</div>
        <div class="stat-sub">Marked unavailable</div>
      </div>
      <div class="stat-card ${pendingOrders ? "warn" : "ok"}">
        <div class="stat-label">Orders today</div>
        <div class="stat-value">${ordersToday}</div>
        <div class="stat-sub">${pendingOrders} new to review</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel-card">
        <h3>Products by category</h3>
        <div class="chip-list">${catRows || "<span class='chip'>No products</span>"}</div>
      </div>
      <div class="panel-card">
        <h3>Recent orders</h3>
        ${recent.length ? renderMiniOrders(recent) : "<p style='color:var(--muted);font-size:13.5px'>No orders yet.</p>"}
      </div>
    </div>
  `;

  $("#dash-manage").addEventListener("click", () => switchTab("products"));
}

function renderMiniOrders(orders) {
  const rows = orders
    .map((o) => {
      const status = o.status || "new";
      return `<tr>
        <td>${new Date(o.created_at).toLocaleDateString()}<div style="color:var(--muted);font-size:11px;margin-top:2px;font-weight:700;letter-spacing:.4px">${esc(o.order_number || "KS-" + String(o.id).padStart(6, "0"))}</div></td>
        <td class="p-name">${esc(o.customer_name)}</td>
        <td class="price">${money(o.total)}</td>
        <td><span class="badge status-${status}">${esc(status)}</span></td>
      </tr>`;
    })
    .join("");

  return `<table class="data" style="min-width:0">
    <thead>
      <tr><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ------------------------------------------------------------
// Products panel
// ------------------------------------------------------------
function renderProductsPanel() {
  const panel = $("#panel-products");
  if (!panel) return;

  const categories = uniqueCategories(PRODUCTS);
  const catOptions = [
    `<option value="all">All categories</option>`,
    ...categories.map(
      ([cat]) =>
        `<option value="${esc(cat)}" ${filters.category === cat ? "selected" : ""}>${esc(cat)}</option>`
    )
  ].join("");

  const stockOptions = [
    `<option value="all">All stock</option>`,
    `<option value="in" ${filters.stock === "in" ? "selected" : ""}>In stock</option>`,
    `<option value="out" ${filters.stock === "out" ? "selected" : ""}>Out of stock</option>`
  ].join("");

  const priceOptions = [
    `<option value="all">All prices</option>`,
    `<option value="empty" ${filters.price === "empty" ? "selected" : ""}>Missing price</option>`,
    `<option value="set" ${filters.price === "set" ? "selected" : ""}>Has price</option>`
  ].join("");

  panel.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Products</h2>
        <p>${PRODUCTS.length} products in the catalog.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="add-product-btn" type="button">+ Add product</button>
        <button class="btn" id="bulk-price-btn" type="button">Set prices</button>
        <button class="btn" id="export-csv-btn" type="button">Export CSV</button>
        <button class="btn" id="import-csv-btn" type="button">Import CSV</button>
      </div>
    </div>

    <div class="toolbar">
      <input class="search" id="p-search" type="search" placeholder="Search products…" value="${esc(filters.search)}">
      <select id="p-category">
        <option value="all">All categories</option>
        ${catOptions}
      </select>
      <select id="p-stock">
        ${stockOptions}
      </select>
      <select id="p-price">
        ${priceOptions}
      </select>
    </div>

    <div class="table-wrap" id="products-table"></div>

    <input type="file" id="csv-file" accept=".csv,text/csv" hidden>
  `;

  $("#add-product-btn").addEventListener("click", () => openProductModal(null));
  $("#bulk-price-btn").addEventListener("click", openBulkPrice);
  $("#export-csv-btn").addEventListener("click", exportCSV);
  $("#import-csv-btn").addEventListener("click", () => $("#csv-file").click());
  $("#csv-file").addEventListener("change", handleCSVImport);

  bindProductFilters();
  renderProductTable();
}

function bindProductFilters() {
  const searchInput = $("#p-search");
  const categorySelect = $("#p-category");
  const stockSelect = $("#p-stock");
  const priceSelect = $("#p-price");

  const refresh = () => {
    filters.search = searchInput.value.trim().toLowerCase();
    filters.category = categorySelect.value;
    filters.stock = stockSelect.value;
    filters.price = priceSelect.value;
    renderProductTable();
  };

  searchInput.addEventListener("input", refresh);
  categorySelect.addEventListener("change", refresh);
  stockSelect.addEventListener("change", refresh);
  priceSelect.addEventListener("change", refresh);
}

function filteredProducts() {
  const term = filters.search;
  return PRODUCTS.filter((p) => {
    if (filters.category !== "all" && p.category !== filters.category) return false;
    if (filters.stock === "in" && !p.in_stock) return false;
    if (filters.stock === "out" && p.in_stock) return false;
    if (filters.price === "empty" && p.price && p.price !== 0) return false;
    if (filters.price === "set" && !p.price && p.price !== 0) return false;
    if (term) {
      const hay = `${p.name} ${p.unit || ""} ${p.category || ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
}

function renderProductTable() {
  const wrap = $("#products-table");
  if (!wrap) return;

  const list = filteredProducts();

  if (!list.length) {
    wrap.innerHTML = `<div class="bulk-empty">No products match your filters.</div>`;
    return;
  }

  const rows = list
    .map((p) => {
      const priceMissing = !p.price && p.price !== 0;
      const priceCell = priceMissing
        ? `<span class="price empty">— <button class="btn" data-price-empty="${p.id}" type="button">Set price</button></span>`
        : `<span class="price">${money(p.price)}</span>`;

      const stockBadge = p.in_stock
        ? `<span class="badge in">In stock</span>`
        : `<span class="badge out">Out</span>`;

      const starBadge = p.featured ? `<span class="badge star">⭐ Featured</span>` : "";

      const groupBadge = p.group_key
        ? `<button class="badge grp" data-group="${esc(p.group_key)}" type="button" title="Show group">G</button>`
        : "";

      const sub = [p.category, p.unit].filter(Boolean).join(" · ");

      return `<tr>
        <td class="p-emoji">${esc(p.emoji || "📦")}</td>
        <td class="p-name">${esc(p.name)}${sub ? `<small>${esc(sub)}</small>` : ""}</td>
        <td>${priceCell}</td>
        <td>${stockBadge}</td>
        <td>${starBadge}</td>
        <td>${groupBadge}</td>
        <td class="row-actions">
          <button class="btn" data-edit="${p.id}" type="button">Edit</button>
          <button class="btn btn-danger" data-delete="${p.id}" type="button">Delete</button>
        </td>
      </tr>`;
    })
    .join("");

  wrap.innerHTML = `<table class="data">
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Status</th>
        <th>Grp</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="table-foot">Showing ${list.length} of ${PRODUCTS.length} products</div>`;

  // Event delegation for row actions (single handler, overwrites on re-render)
  wrap.onclick = (ev) => {
    const editBtn = ev.target.closest("[data-edit]");
    if (editBtn) {
      const p = PRODUCTS.find((x) => x.id == editBtn.dataset.edit);
      if (p) openProductModal(p);
      return;
    }

    const delBtn = ev.target.closest("[data-delete]");
    if (delBtn) {
      const p = PRODUCTS.find((x) => x.id == delBtn.dataset.delete);
      if (p) {
        if (confirm(`Delete "${p.name}" (${money(p.price)})?\nThis affects every row with the same group.`)) {
          deleteProduct(p);
        }
      }
      return;
    }

    const priceBtn = ev.target.closest("[data-price-empty]");
    if (priceBtn) {
      openQuickPrice(+priceBtn.dataset.priceEmpty);
      return;
    }

    const groupBtn = ev.target.closest("[data-group]");
    if (groupBtn) {
      filters.search = groupBtn.dataset.group;
      const searchInput = $("#p-search");
      if (searchInput) searchInput.value = groupBtn.dataset.group;
      renderProductTable();
    }
  };
}

// ------------------------------------------------------------
// Product add / edit
// ------------------------------------------------------------
function openProductModal(product) {
  const isEdit = !!product;
  const p = isEdit
    ? product
    : { name: "", emoji: "", category: "", price: null, unit: "", image_url: "", group_key: "", in_stock: true, featured: false, sort_order: nextSortOrder() };

  let groupNote = "";
  if (isEdit && p.group_key) {
    const siblings = PRODUCTS.filter((x) => x.group_key === p.group_key && x.id !== p.id);
    if (siblings.length) {
      const chips = siblings
        .map((s) => `<span>${esc(s.name)} · ${s.price ? money(s.price) : "price?"}</span>`)
        .join("");
      groupNote = `<div class="group-note full">
        Shared group <strong>${esc(p.group_key)}</strong> — ${siblings.length} more row(s):
        <div class="chips">${chips}</div>
      </div>`;
    }
  }

  const categories = uniqueCategories(PRODUCTS).map(([c]) => c);
  const catOptions = categories
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("");

  const modal = document.createElement("div");
  modal.className = "modal-bg";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>${isEdit ? "Edit product" : "Add product"}</h3>
        <button class="modal-close" type="button" aria-label="Close">×</button>
      </div>
      <form id="product-form" class="form-grid">
        <div class="field full">
          <label>Product name *</label>
          <input name="name" type="text" required value="${esc(p.name)}" placeholder="e.g. Cinthol Cool (40g)">
        </div>

        <div class="field">
          <label>Emoji</label>
          <input name="emoji" type="text" value="${esc(p.emoji || "")}" placeholder="e.g. 🧼">
          <div class="hint">Shown when there is no image.</div>
        </div>

        <div class="field">
          <label>Category *</label>
          <input name="category" type="text" list="admin-cats" required value="${esc(p.category)}" placeholder="e.g. Bath &amp; Body">
          <datalist id="admin-cats">${catOptions}</datalist>
        </div>

        <div class="field">
          <label>Price (₹)</label>
          <input name="price" type="number" min="0" step="0.5" value="${p.price == null ? "" : p.price}" placeholder="40">
          <div class="hint">Leave empty to mark "price needed".</div>
        </div>

        <div class="field">
          <label>Unit</label>
          <input name="unit" type="text" value="${esc(p.unit || "")}" placeholder="per pack">
        </div>

        <div class="field">
          <label>Group key</label>
          <input name="group_key" type="text" value="${esc(p.group_key || "")}" placeholder="e.g. Cinthol Cool">
          <div class="hint">Same key = sizes shown together.</div>
        </div>

        <div class="field">
          <label>Sort order</label>
          <input name="sort_order" type="number" step="1" value="${esc(p.sort_order)}">
          <div class="hint">Lower shows first.</div>
        </div>

        <div class="field full">
          <label>Image URL</label>
          <input name="image_url" type="url" value="${esc(p.image_url || "")}" placeholder="https://…">
          <div class="img-preview" id="img-preview"></div>
        </div>

        ${groupNote}

        <div class="field full">
          <div class="toggle-row">
            <label class="toggle"><input name="in_stock" type="checkbox" ${p.in_stock ? "checked" : ""}> In stock</label>
            <label class="toggle"><input name="featured" type="checkbox" ${p.featured ? "checked" : ""}> Featured</label>
          </div>
        </div>

        <div class="modal-foot full">
          ${isEdit ? `<button class="btn btn-danger" id="form-delete" type="button">Delete</button>` : ""}
          <div style="flex:1"></div>
          <button class="btn" type="button" id="form-cancel">Cancel</button>
          <button class="btn btn-green" type="submit">${isEdit ? "Save changes" : "Add product"}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Image preview
  const preview = modal.querySelector("#img-preview");
  const imgInput = modal.querySelector('input[name="image_url"]');

  function renderPreview() {
    const url = imgInput.value.trim();
    preview.innerHTML = url
      ? `<img src="${esc(url)}" alt="" onerror="this.style.display='none'">
         <span>Link set — review above.</span>`
      : `<span class="img-empty">No image — the emoji will be shown instead.</span>`;
  }

  renderPreview();
  imgInput.addEventListener("input", renderPreview);

  // Modal controls
  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.querySelector("#form-cancel").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });
  modal.querySelector("#product-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    await saveProduct(modal, isEdit, p);
  });

  if (isEdit) {
    modal.querySelector("#form-delete").addEventListener("click", async () => {
      modal.remove();
      if (confirm(`Delete "${p.name}"?`)) await deleteProduct(p);
    });
  }
}

function nextSortOrder() {
  let max = 0;
  PRODUCTS.forEach((p) => {
    if (typeof p.sort_order === "number" && p.sort_order > max) max = p.sort_order;
  });
  return max + 1;
}

async function saveProduct(modal, isEdit, original) {
  const form = modal.querySelector("#product-form");
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "").trim();

  if (!name || !category) {
    showToast("Name and category are required.");
    return;
  }

  const priceRaw = String(data.get("price") || "").trim();
  const sortRaw = String(data.get("sort_order") || "").trim();

  const payload = {
    name,
    emoji: String(data.get("emoji") || "").trim(),
    category,
    price: priceRaw === "" ? null : Number(priceRaw),
    unit: String(data.get("unit") || "").trim(),
    image_url: String(data.get("image_url") || "").trim(),
    group_key: String(data.get("group_key") || "").trim() || null,
    in_stock: !!data.get("in_stock"),
    featured: !!data.get("featured"),
    sort_order: sortRaw === "" ? nextSortOrder() : Number(sortRaw)
  };

  let error = null;

  if (isEdit && original.id) {
    const res = await supabaseClient
      .from("products")
      .update(payload)
      .eq("id", original.id);
    error = res.error;
  } else {
    const res = await supabaseClient.from("products").insert(payload);
    error = res.error;
  }

  if (error) {
    console.error("saveProduct error", error);
    showToast("Save failed: " + error.message);
    return;
  }

  // Apply group_key to all rows sharing it (keeps variant family in sync)
  if (isEdit && payload.group_key) {
    const siblings = PRODUCTS.filter(
      (x) => x.group_key === payload.group_key && x.id !== original.id
    );
    if (siblings.length) {
      const sync = {
        name: payload.name,
        emoji: payload.emoji,
        category: payload.category,
        unit: payload.unit,
        in_stock: payload.in_stock,
        featured: payload.featured
      };
      const res = await supabaseClient
        .from("products")
        .update(sync)
        .eq("group_key", payload.group_key)
        .neq("id", original.id);
      if (res.error) console.error("sync group error", res.error);
    }
  }

  modal.remove();
  showToast(isEdit ? "Product updated." : "Product added.");
  await loadProducts();
  updateTabCounts();
  renderProductTable();
}

async function deleteProduct(product) {
  const res = await supabaseClient.from("products").delete().eq("id", product.id);
  if (res.error) {
    console.error("delete error", res.error);
    showToast("Delete failed: " + res.error.message);
    return;
  }
  showToast("Product deleted.");
  await loadProducts();
  updateTabCounts();
  renderProductTable();
}

// ------------------------------------------------------------
// Quick price setter + bulk price editor
// ------------------------------------------------------------
function openQuickPrice(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  if (p.group_key) {
    openBulkPrice(p.group_key);
  } else {
    const target = PRODUCTS.filter((x) => x.id === id);
    openBulkPriceFor(target);
  }
}

function openBulkPrice(group) {
  let target;
  if (group) {
    target = PRODUCTS.filter((p) => p.group_key === group);
  } else {
    target = PRODUCTS.filter((p) => !p.price && p.price !== 0);
  }

  if (!target.length) {
    showToast("No products need a price here.");
    return;
  }

  openBulkPriceFor(target);
}

function openBulkPriceFor(list) {
  const modal = document.createElement("div");
  modal.className = "modal-bg";

  const items = list
    .map(
      (p) => `<div class="price-cell" data-id="${p.id}">
        <div class="pc-name">${esc(p.emoji || "📦")} ${esc(p.name)}
          <small>${esc(p.category || "")}${p.group_key ? " · group: " + esc(p.group_key) : ""}</small>
        </div>
        <input class="bulk-price" type="number" min="0" step="0.5" value="${p.price == null ? "" : p.price}" data-id="${p.id}" placeholder="Price (₹)">
      </div>`
    )
    .join("");

  modal.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Set prices</h3>
        <button class="modal-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="price-grid">${items}</div>
      <div class="modal-foot">
        <button class="btn" id="bp-cancel" type="button">Cancel</button>
        <button class="btn btn-green" id="bp-save" type="button">Save ${list.length} price(s)</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
  modal.querySelector("#bp-cancel").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });

  modal.querySelector("#bp-save").addEventListener("click", async () => {
    const changes = [];
    modal.querySelectorAll(".bulk-price").forEach((input) => {
      const raw = input.value.trim();
      changes.push({
        id: +input.dataset.id,
        price: raw === "" ? null : Number(raw)
      });
    });

    const btn = modal.querySelector("#bp-save");
    btn.disabled = true;
    btn.textContent = "Saving…";

    let updated = 0;
    for (const change of changes) {
      const res = await supabaseClient
        .from("products")
        .update({ price: change.price })
        .eq("id", change.id);
      if (!res.error) updated++;
    }

    btn.disabled = false;
    btn.textContent = "Saved";

    showToast(`Updated ${updated} price(s).`);
    modal.remove();
    await loadProducts();
    updateTabCounts();
    renderProductTable();
    if (currentTab === "dashboard") renderDashboard();
  });
}

// ------------------------------------------------------------
// CSV export / import
// ------------------------------------------------------------
function csvEscape(value) {
  const s = String(value == null ? "" : value);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportCSV() {
  const header = ["name", "emoji", "category", "price", "unit", "image_url", "group_key", "in_stock", "featured", "sort_order", "id"];
  const lines = PRODUCTS.map((p) =>
    [
      csvEscape(p.name),
      csvEscape(p.emoji),
      csvEscape(p.category),
      csvEscape(p.price == null ? "" : p.price),
      csvEscape(p.unit),
      csvEscape(p.image_url),
      csvEscape(p.group_key),
      csvEscape(p.in_stock ? "true" : "false"),
      csvEscape(p.featured ? "true" : "false"),
      csvEscape(p.sort_order == null ? "" : p.sort_order),
      csvEscape(p.id == null ? "" : p.id)
    ].join(",")
  );

  const csv = [header.join(","), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported products.csv");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);

  return rows;
}

async function handleCSVImport(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  const text = await file.text();
  const rows = parseCSV(text);

  if (!rows.length) {
    showToast("CSV is empty.");
    return;
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const idx = {
    name: col("name"),
    emoji: col("emoji"),
    category: col("category"),
    price: col("price"),
    unit: col("unit"),
    image_url: col("image_url"),
    group_key: col("group_key"),
    in_stock: col("in_stock"),
    featured: col("featured"),
    sort_order: col("sort_order"),
    id: col("id")
  };

  if (idx.name === -1 || idx.category === -1) {
    showToast("CSV must include name and category columns.");
    return;
  }

  const existingIds = new Set(PRODUCTS.map((p) => String(p.id)));

  let toInsert = [];
  let toUpdate = [];
  const skipped = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (i) => (i >= 0 && row[i] != null ? row[i].trim() : "");

    const name = get(idx.name);
    const category = get(idx.category);
    if (!name || !category) {
      skipped.push(`row ${r + 1} (missing name/category)`);
      continue;
    }

    const priceRaw = get(idx.price);
    const price = priceRaw === "" ? null : Number(priceRaw);

    const record = {
      name,
      emoji: get(idx.emoji),
      category,
      price,
      unit: get(idx.unit),
      image_url: get(idx.image_url),
      group_key: get(idx.group_key) || null,
      in_stock: get(idx.in_stock) !== "false",
      featured: get(idx.featured) === "true",
      sort_order: get(idx.sort_order) === "" ? null : Number(get(idx.sort_order))
    };

    const csvId = get(idx.id);

    if (csvId && existingIds.has(csvId)) {
      toUpdate.push({ id: Number(csvId), ...record });
    } else {
      const { id, ...rest } = record;
      toInsert.push(rest);
    }
  }

  if (toInsert.length > 100) {
    showToast(`Importing ${toInsert.length} new rows + ${toUpdate.length} updates…`);
  }

  let inserted = 0;
  let updated = 0;

  // insert in chunks of 100
  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100);
    const res = await supabaseClient.from("products").insert(chunk);
    if (res.error) {
      console.error("insert chunk error", res.error);
      showToast("Import insert error: " + res.error.message);
    } else {
      inserted += chunk.length;
    }
  }

  for (const rec of toUpdate) {
    const { id, ...payload } = rec;
    const res = await supabaseClient.from("products").update(payload).eq("id", id);
    if (!res.error) updated++;
  }

  await loadProducts();
  updateTabCounts();
  renderProductTable();

  let msg = `Imported: ${inserted} new, ${updated} updated.`;
  if (skipped.length) msg += ` Skipped ${skipped.length}: ${skipped.join(", ")}`;
  showToast(msg);
}

// ------------------------------------------------------------
// Orders panel
// ------------------------------------------------------------
function renderOrdersPanel() {
  const panel = $("#panel-orders");
  if (!panel) return;

  const counts = {
    new: ORDERS.filter((o) => o.status === "new").length,
    confirmed: ORDERS.filter((o) => o.status === "confirmed").length,
    delivered: ORDERS.filter((o) => o.status === "delivered").length,
    cancelled: ORDERS.filter((o) => o.status === "cancelled").length
  };

  panel.innerHTML = `
    <div class="page-head">
      <div>
        <h2>Orders</h2>
        <p>${ORDERS.length} total · ${counts.new} new · ${counts.confirmed} confirmed · ${counts.delivered} delivered · ${counts.cancelled} cancelled</p>
      </div>
    </div>

    ${ORDERS.length ? "" : "<div class='bulk-empty'>No orders yet. Orders placed on the store will appear here automatically.</div>"}

    ${ORDERS.length ? `<div class="table-wrap" id="orders-table"></div>` : ""}
  `;

  if (ORDERS.length) renderOrdersTable();
}

function renderOrdersTable() {
  const wrap = $("#orders-table");
  if (!wrap) return;

  const rows = ORDERS.map((o) => {
    const status = o.status || "new";
    const items = Array.isArray(o.items) ? o.items : [];
    const itemLines = items
      .map((it) => `• ${esc(it.name || "Item")} × ${it.qty ?? ""} = ${money(it.price * (it.qty || 1))}`)
      .join("<br>");

    return `<tr>
      <td style="white-space:nowrap">
        <div>${new Date(o.created_at).toLocaleString()}</div>
        <div style="color:var(--green-800);font-weight:800;font-size:11.5px;letter-spacing:.4px">${esc(o.order_number || "KS-" + String(o.id).padStart(6, "0"))}</div>
      </td>
      <td class="p-name">${esc(o.customer_name)}</td>
      <td style="white-space:nowrap;color:var(--muted)">${esc(o.phone)}</td>
      <td style="max-width:220px">${esc(o.delivery)}</td>
      <td class="price">${money(o.total)}</td>
      <td>
        <select class="status-select status-${status}" data-order-id="${o.id}">
          <option value="new" ${status === "new" ? "selected" : ""}>New</option>
          <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="delivered" ${status === "delivered" ? "selected" : ""}>Delivered</option>
          <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td>
        <details class="order-detail">
          <summary>Items (${items.length})</summary>
          <div class="od-body">
            <div class="od-meta">Placed ${new Date(o.created_at).toLocaleString()}</div>
            <p style="margin:6px 0">${itemLines || "—"}</p>
            <div style="color:var(--muted);font-size:12px">Call/WhatsApp: <a href="tel:${esc(o.phone)}" target="_blank" rel="noopener">${esc(o.phone)}</a></div>
          </div>
        </details>
      </td>
      <td class="row-actions">
        <button class="btn btn-danger" data-del-order="${o.id}" type="button">Delete</button>
      </td>
    </tr>`;
  }).join("");

  wrap.innerHTML = `<table class="data">
    <thead>
      <tr>
        <th>Placed</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>Delivery</th>
        <th>Total</th>
        <th>Status</th>
        <th>Details</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;

  wrap.onchange = async (ev) => {
    const sel = ev.target.closest("[data-order-id]");
    if (!sel) return;
    const id = +sel.dataset.orderId;
    const status = sel.value;
    const res = await supabaseClient
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (res.error) {
      console.error("status update error", res.error);
      showToast("Status update failed.");
    } else {
      showToast("Order marked " + status + ".");
      await loadOrders();
      updateTabCounts();
      renderOrdersTable();
    }
  };

  wrap.onclick = (ev) => {
    const delBtn = ev.target.closest("[data-del-order]");
    if (!delBtn) return;
    const id = +delBtn.dataset.delOrder;
    if (!confirm(`Delete order #${id}?`)) return;
    supabaseClient
      .from("orders")
      .delete()
      .eq("id", id)
      .then(async (res) => {
        if (res.error) {
          showToast("Delete failed.");
          return;
        }
        showToast("Order deleted.");
        await loadOrders();
        updateTabCounts();
        renderOrdersPanel();
      });
  };
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
$("#login-form").addEventListener("submit", handleLogin);
init();