const PRODUCTS = [
  // SNACKS
  { name: "GoodDay Biscuit",      emoji: "🍪", category: "Snacks",      price: 5,  unit: "per pack" },
  { name: "GoodDay Biscuit",      emoji: "🍪", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "GoodDay Biscuit",      emoji: "🍪", category: "Snacks",      price: 20,  unit: "per pack" },
  { name: "GoodDay Biscuit",      emoji: "🍪", category: "Snacks",      price: 50,  unit: "per pack" },
  { name: "GoodDay Biscuit chocklate",      emoji: "🍪", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "Britannia Bourbon",      emoji: "🍪", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "Britannia Bourbon",      emoji: "🍪", category: "Snacks",      price: 20,  unit: "per pack" },
  { name: "marie gold",      emoji: "🍪", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "marie gold",      emoji: "🍪", category: "Snacks",      price: 30,  unit: "per pack" },
  { name: "Parle-G Biscuit",      emoji: "🍘", category: "Snacks",      price: 5,  unit: "per pack" },
  { name: "Parle-G Biscuit",      emoji: "🍘", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "sunfest ",      emoji: "🍘", category: "Snacks",      price: 5,  unit: "per pack" },
  { name: "Lays Chips",           emoji: "🥔", category: "Snacks",      price: 20,  unit: "per pack" },
  { name: "Bourbon Biscuit",      emoji: "🍫", category: "Snacks",      price: 20,  unit: "per pack" },
  { name: "Murukku",              emoji: "🌀", category: "Snacks",      price: 30,  unit: "per pack" },
  { name: "Mixture",              emoji: "🥜", category: "Snacks",      price: 20,  unit: "per pack" },

  // BEVERAGES
  { name: "Pepsi – 500ml",        emoji: "🥤", category: "Beverages",   price: 40,  unit: "bottle" },
  { name: "Frooti – 200ml",       emoji: "🧃", category: "Beverages",   price: 15,  unit: "pack" },
  { name: "Sprite – 500ml",       emoji: "🍾", category: "Beverages",   price: 40,  unit: "bottle" },
  { name: "Energy Drink",         emoji: "⚡", category: "Beverages",   price: 80,  unit: "can" },
  { name: "Buttermilk",           emoji: "🫙", category: "Beverages",   price: 20,  unit: "pack" },
  { name: "Water Bottle – 1L",    emoji: "💧", category: "Beverages",   price: 20,  unit: "bottle" },

  // DAIRY
  { name: "Milk – 500ml",         emoji: "🥛", category: "Dairy",       price: 27,  unit: "packet" },
  { name: "Curd – 200g",          emoji: "🍶", category: "Dairy",       price: 25,  unit: "cup" },
  { name: "Butter – 100g",        emoji: "🧈", category: "Dairy",       price: 55,  unit: "pack" },
  { name: "Paneer – 200g",        emoji: "🫙", category: "Dairy",       price: 90,  unit: "pack" },

  // GROCERIES
  { name: "Rice – 1 kg",          emoji: "🍚", category: "Groceries",   price: 70,  unit: "per kg" },
  { name: "Toor Dal – 500g",      emoji: "🫘", category: "Groceries",   price: 65,  unit: "pack" },
  { name: "Sugar – 1 kg",         emoji: "🍬", category: "Groceries",   price: 45,  unit: "per kg" },
  { name: "Cooking Oil – 1L",     emoji: "🫙", category: "Groceries",   price: 140, unit: "bottle" },
  { name: "Salt – 1 kg",          emoji: "🧂", category: "Groceries",   price: 20,  unit: "pack" },
  { name: "Atta – 1 kg",          emoji: "🌾", category: "Groceries",   price: 55,  unit: "pack" },
  { name: "Tomato – 500g",        emoji: "🍅", category: "Groceries",   price: 30,  unit: "500g" },
  { name: "Onion – 1 kg",         emoji: "🧅", category: "Groceries",   price: 40,  unit: "per kg" },
  { name: "Potato – 1 kg",        emoji: "🥔", category: "Groceries",   price: 35,  unit: "per kg" },

  // QUICK MEALS
  { name: "Maggi Noodles",        emoji: "🍜", category: "Quick meals", price: 15,  unit: "per pack" },
  { name: "Yippee Noodles",       emoji: "🍜", category: "Quick meals", price: 15,  unit: "per pack" },
  { name: "Cup Noodles",          emoji: "🍵", category: "Quick meals", price: 30,  unit: "per cup" },
  { name: "MTR Upma Mix",         emoji: "🫕", category: "Quick meals", price: 45,  unit: "per pack" },
  { name: "Poha – 500g",          emoji: "🍚", category: "Quick meals", price: 35,  unit: "per pack" },
  // BATH & BODY
  { name: "Bath Soap",          emoji: "🧼", category: "Bath & Body",  price: 40, unit: "per bar" },
  { name: "Shampoo Sachet",     emoji: "🧴", category: "Bath & Body",  price: 5,  unit: "per sachet" },
  { name: "Toothpaste – 100g",  emoji: "🦷", category: "Bath & Body",  price: 50, unit: "tube" },
  { name: "Toothbrush",         emoji: "🪥", category: "Bath & Body",  price: 30, unit: "each" },
  { name: "Sanitary Pads",      emoji: "🩸", category: "Bath & Body",  price: 55, unit: "per pack" },

  // HOME CLEANING
  { name: "Washing Powder",     emoji: "🧺", category: "Home Cleaning", price: 60, unit: "per pack" },
  { name: "Dish Soap",          emoji: "🫧", category: "Home Cleaning", price: 35, unit: "per bar" },
  { name: "Phenyl – 500ml",     emoji: "🧽", category: "Home Cleaning", price: 60, unit: "bottle" },

  // STATIONERY
  { name: "Notebook – 200 pages", emoji: "📓", category: "Stationery",  price: 60,  unit: "each" },
  { name: "Pen (Blue)",           emoji: "🖊️", category: "Stationery",  price: 10,  unit: "each" },
  { name: "Pencil Set",           emoji: "✏️", category: "Stationery",  price: 20,  unit: "per pack" },
  { name: "Stapler",              emoji: "📌", category: "Stationery",  price: 80,  unit: "each" },
];

const WA_NUMBER = "917667771101";
const cart = {};
let activeCategory = "All";
let quickFilter = null;

const $ = (id) => document.getElementById(id);

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function productMatches(product, query) {
  if (!query) return true;
  const text = `${product.name} ${product.category} ${product.unit || ""}`.toLowerCase();
  return text.includes(query.toLowerCase());
}

function getFilteredProducts() {
  const query = $("search-input").value.trim();
  return PRODUCTS.filter((product) => {
    const categoryOK = activeCategory === "All" || product.category === activeCategory;
    const searchOK = productMatches(product, query);
    const quickOK =
      quickFilter === "under50" ? product.price <= 50 :
      quickFilter === "popular" ? product.price <= 100 : true;
    return categoryOK && searchOK && quickOK;
  });
}

function renderProducts() {
  const grid = $("product-grid");
  const empty = $("empty-state");
  const products = getFilteredProducts();
  grid.innerHTML = "";

  $("result-count").textContent =
    `${products.length} product${products.length === 1 ? "" : "s"}`;

  products.forEach((product) => {
    const index = PRODUCTS.indexOf(product);
    const qty = cart[index] || 0;
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-visual">
        <span class="product-icon">${product.emoji}</span>
        ${product.price <= 20 ? '<span class="price-badge">Value</span>' : ""}
      </div>
      <div class="product-cat">${product.category}</div>
      <h3>${product.name}</h3>
      <div class="product-meta">
        <strong>${money(product.price)}</strong>
        <span>${product.unit || ""}</span>
      </div>
      <div class="add-controls">
        <div class="qty-box ${qty > 0 ? "visible" : ""}">
          <button class="qty-btn" data-action="dec" data-idx="${index}" type="button">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" data-action="inc" data-idx="${index}" type="button">+</button>
        </div>
        <button class="add-btn" data-idx="${index}" type="button" ${qty > 0 ? 'style="display:none"' : ""}>+ Add</button>
      </div>
    `;
    grid.appendChild(card);
  });

  empty.hidden = products.length !== 0;
}

function changeQty(index, delta) {
  const next = Math.max(0, (cart[index] || 0) + delta);
  if (next === 0) delete cart[index];
  else cart[index] = next;
  updateCart();
}

function getCartTotals() {
  let items = 0, total = 0;
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
  $("float-count").textContent = `${items} item${items === 1 ? "" : "s"}`;
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
        <p>Add products from the shop and they will appear here.</p>
        <button class="primary-btn" type="button" onclick="closeCart(); document.getElementById('shop').scrollIntoView({behavior:'smooth'})">Start shopping</button>
      </div>`;
    $("panel-total").textContent = "₹0";
    return;
  }

  let total = 0;
  box.innerHTML = entries.map(([idx, qty]) => {
    const product = PRODUCTS[idx];
    const subtotal = product.price * qty;
    total += subtotal;
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${product.emoji}</div>
        <div class="cart-item-info">
          <strong>${product.name}</strong>
          <small>${money(product.price)} · ${product.unit || ""}</small>
          <div class="cart-item-qty">
            <button class="ci-btn" data-action="dec" data-idx="${idx}" type="button">−</button>
            <span>${qty}</span>
            <button class="ci-btn" data-action="inc" data-idx="${idx}" type="button">+</button>
          </div>
        </div>
        <strong class="cart-item-subtotal">${money(subtotal)}</strong>
      </div>`;
  }).join("");

  $("panel-total").textContent = money(total);
}

function openCart() {
  renderCartPanel();
  $("cart-overlay").classList.add("open");
  $("cart-overlay").setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  $("cart-overlay").classList.remove("open");
  $("cart-overlay").setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

$("product-grid").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-idx]");
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  changeQty(idx, btn.dataset.action === "dec" ? -1 : 1);
  if (btn.classList.contains("add-btn")) showToast(`${PRODUCTS[idx].name} added to cart`);
});

$("cart-items-panel").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-idx]");
  if (!btn) return;
  changeQty(Number(btn.dataset.idx), btn.dataset.action === "inc" ? 1 : -1);
});

$("cat-bar").addEventListener("click", (event) => {
  const tab = event.target.closest(".cat-tab");
  if (!tab) return;
  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  activeCategory = tab.dataset.cat;
  quickFilter = null;
  renderProducts();
  $("shop").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("search-input").addEventListener("input", renderProducts);
$("clear-search").addEventListener("click", () => {
  $("search-input").value = "";
  renderProducts();
  $("search-input").focus();
});

document.querySelectorAll("[data-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.quick;
    quickFilter = type === "all" ? null : type;
    if (type === "all") {
      activeCategory = "All";
      document.querySelectorAll(".cat-tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === "All"));
    }
    renderProducts();
  });
});

$("reset-filters").addEventListener("click", () => {
  activeCategory = "All";
  quickFilter = null;
  $("search-input").value = "";
  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === "All"));
  renderProducts();
});

$("shop-now").addEventListener("click", () => {
  $("shop").scrollIntoView({ behavior: "smooth" });
});

$("open-cart-btn").addEventListener("click", openCart);
$("close-cart-btn").addEventListener("click", closeCart);
$("overlay-bg").addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

$("clear-btn").addEventListener("click", () => {
  Object.keys(cart).forEach((key) => delete cart[key]);
  updateCart();
  showToast("Cart cleared");
});

$("wa-order-btn").addEventListener("click", () => {
  const { items, total } = getCartTotals();
  const name = $("c-name").value.trim();
  const phone = $("c-phone").value.trim();
  const place = $("c-place").value.trim();

  if (!items) return showToast("Please add at least one product.");
  if (!name || !phone || !place) return showToast("Please fill in all delivery details.");

  const lines = Object.entries(cart).map(([idx, qty]) => {
    const p = PRODUCTS[idx];
    return `• ${p.name} × ${qty} = ${money(p.price * qty)}`;
  });

  const message =
    `*New Order – Kalaivani Stores*\\n\\n` +
    `*Name:* ${name}\\n` +
    `*Phone:* ${phone}\\n` +
    `*Delivery:* ${place}\\n\\n` +
    `*Items:*\\n${lines.join("\\n")}\\n\\n` +
    `*Total: ${money(total)}*\\n\\n` +
    `Please confirm this order. Thank you!`;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  showToast("Opening WhatsApp…");
});

renderProducts();
updateCart();
