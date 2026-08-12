// ─────────────────────────────────────────────────────────────
//  PRODUCT LIST
//  To add a new product, copy one line and change the values.
//  Categories: "Snacks" | "Beverages" | "Dairy" | "Groceries"
//            | "Quick meals" | "Toiletries" | "Stationery"
// ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  // SNACKS
  { name: "GoodDay Biscuit",      emoji: "🍪", category: "Snacks",      price: 10,  unit: "per pack" },
  { name: "Parle-G Biscuit",      emoji: "🍘", category: "Snacks",      price: 10,  unit: "per pack" },
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

  // TOILETRIES
  { name: "Bath Soap",            emoji: "🧼", category: "Toiletries",  price: 40,  unit: "per bar" },
  { name: "Shampoo Sachet",       emoji: "🧴", category: "Toiletries",  price: 5,   unit: "per sachet" },
  { name: "Toothpaste – 100g",    emoji: "🦷", category: "Toiletries",  price: 50,  unit: "tube" },
  { name: "Toothbrush",           emoji: "🪥", category: "Toiletries",  price: 30,  unit: "each" },
  { name: "Washing Powder",       emoji: "🧺", category: "Toiletries",  price: 60,  unit: "per pack" },
  { name: "Dish Soap",            emoji: "🫧", category: "Toiletries",  price: 35,  unit: "per bar" },
  { name: "Phenyl – 500ml",       emoji: "🧽", category: "Toiletries",  price: 60,  unit: "bottle" },
  { name: "Sanitary Pads",        emoji: "🩸", category: "Toiletries",  price: 55,  unit: "per pack" },

  // STATIONERY
  { name: "Notebook – 200 pages", emoji: "📓", category: "Stationery",  price: 60,  unit: "each" },
  { name: "Pen (Blue)",           emoji: "🖊️", category: "Stationery",  price: 10,  unit: "each" },
  { name: "Pencil Set",           emoji: "✏️", category: "Stationery",  price: 20,  unit: "per pack" },
  { name: "Stapler",              emoji: "📌", category: "Stationery",  price: 80,  unit: "each" },
];

// ─────────────────────────────────────────────────────────────
//  SHOP WHATSAPP NUMBER
//  Write country code + number. No +, spaces, or dashes.
//  Example: India +91 → "91" + number
// ─────────────────────────────────────────────────────────────
const WA_NUMBER = "917667771101";


// ─────────────────────────────────────────────────────────────
//  CART  (object: { productIndex: quantity })
// ─────────────────────────────────────────────────────────────
const cart = {};


// ─────────────────────────────────────────────────────────────
//  RENDER PRODUCTS
//  Filters by category and search text, then draws all cards.
// ─────────────────────────────────────────────────────────────
function renderProducts(filterCat, searchText) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";

  const query = (searchText || "").toLowerCase();

  PRODUCTS.forEach(function (product, index) {
    // Check if this product matches the active category
    const matchCategory =
      !filterCat || filterCat === "All" || product.category === filterCat;

    // Check if it matches the search text
    const matchSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    if (!matchCategory || !matchSearch) return;

    const qty = cart[index] || 0;

    // Build the card HTML
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.index = index;

    card.innerHTML =
      '<div class="product-emoji">' + product.emoji + "</div>" +
      '<div class="product-cat">' + product.category + "</div>" +
      '<div class="product-name">' + product.name + "</div>" +
      '<div class="product-price">₹' + product.price +
        ' <span class="product-unit">' + (product.unit || "") + "</span></div>" +
      '<div class="add-controls">' +
        '<div class="qty-box' + (qty > 0 ? " visible" : "") + '" id="qb-' + index + '">' +
          '<button class="qty-btn" data-action="dec" data-idx="' + index + '">−</button>' +
          '<span class="qty-num" id="qn-' + index + '">' + qty + "</span>" +
          '<button class="qty-btn" data-action="inc" data-idx="' + index + '">+</button>' +
        "</div>" +
        '<button class="add-btn" id="ab-' + index + '" data-idx="' + index + '"' +
          (qty > 0 ? ' style="display:none"' : "") + ">+ Add</button>" +
      "</div>";

    grid.appendChild(card);
  });

  // Attach click events to all qty buttons and add buttons
  grid.querySelectorAll(".qty-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx    = Number(btn.dataset.idx);
      var action = btn.dataset.action;
      changeQty(idx, action === "inc" ? 1 : -1);
    });
  });

  grid.querySelectorAll(".add-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      changeQty(Number(btn.dataset.idx), 1);
    });
  });
}


// ─────────────────────────────────────────────────────────────
//  CHANGE QUANTITY
//  Updates cart, updates the card controls, updates badge.
// ─────────────────────────────────────────────────────────────
function changeQty(index, delta) {
  // Update cart count
  cart[index] = Math.max(0, (cart[index] || 0) + delta);
  if (cart[index] === 0) {
    delete cart[index];
  }

  // Update the card controls on the page
  var qtyBox  = document.getElementById("qb-" + index);
  var qtyNum  = document.getElementById("qn-" + index);
  var addBtn  = document.getElementById("ab-" + index);

  if (qtyBox && qtyNum && addBtn) {
    var currentQty = cart[index] || 0;
    qtyNum.textContent = currentQty;

    if (currentQty > 0) {
      qtyBox.classList.add("visible");
      addBtn.style.display = "none";
    } else {
      qtyBox.classList.remove("visible");
      addBtn.style.display = "";
    }
  }

  updateCartBadge();
  renderCartPanel();
}


// ─────────────────────────────────────────────────────────────
//  CART BADGE (the red number on the cart button)
// ─────────────────────────────────────────────────────────────
function updateCartBadge() {
  var totalItems = 0;
  var totalPrice = 0;

  for (var idx in cart) {
    totalItems += cart[idx];
    totalPrice += PRODUCTS[idx].price * cart[idx];
  }

  var badge = document.getElementById("cart-badge");
  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? "grid" : "none";

  // Update floating cart bar
  var floatCart = document.getElementById("float-cart");
  document.getElementById("float-count").textContent =
    totalItems + " item" + (totalItems !== 1 ? "s" : "");
  document.getElementById("float-total").textContent = "₹" + totalPrice;
  floatCart.classList.toggle("show", totalItems > 0);
}


// ─────────────────────────────────────────────────────────────
//  RENDER CART PANEL (the slide-in cart drawer)
// ─────────────────────────────────────────────────────────────
function renderCartPanel() {
  var box     = document.getElementById("cart-items-panel");
  var entries = Object.entries(cart);

  // Empty state
  if (entries.length === 0) {
    box.innerHTML =
      '<div class="cart-empty">' +
        '<div class="cart-empty-icon">🛒</div>' +
        "<p>Your cart is empty</p>" +
        '<p class="cart-empty-sub">Add items to get started</p>' +
      "</div>";
    document.getElementById("panel-total").textContent = "₹0";
    return;
  }

  var total = 0;
  var html  = "";

  entries.forEach(function (entry) {
    var idx     = entry[0];
    var qty     = entry[1];
    var product = PRODUCTS[idx];
    var sub     = product.price * qty;
    total += sub;

    html +=
      '<div class="cart-item">' +
        '<div class="cart-item-emoji">' + product.emoji + "</div>" +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + product.name + "</div>" +
          '<div class="cart-item-price">₹' + product.price + " each</div>" +
          '<div class="cart-item-qty">' +
            '<button class="ci-btn" data-action="dec" data-idx="' + idx + '">−</button>' +
            '<span class="ci-num">' + qty + "</span>" +
            '<button class="ci-btn" data-action="inc" data-idx="' + idx + '">+</button>' +
          "</div>" +
        "</div>" +
        '<div class="cart-item-subtotal">₹' + sub + "</div>" +
      "</div>";
  });

  box.innerHTML = html;
  document.getElementById("panel-total").textContent = "₹" + total;

  // Attach events to cart panel qty buttons
  box.querySelectorAll(".ci-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx    = Number(btn.dataset.idx);
      var action = btn.dataset.action;
      changeQty(idx, action === "inc" ? 1 : -1);
    });
  });
}


// ─────────────────────────────────────────────────────────────
//  OPEN / CLOSE CART
// ─────────────────────────────────────────────────────────────
function openCart() {
  renderCartPanel();
  document.getElementById("cart-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("open-cart-btn").addEventListener("click", openCart);
document.getElementById("close-cart-btn").addEventListener("click", closeCart);
document.getElementById("overlay-bg").addEventListener("click", closeCart);


// ─────────────────────────────────────────────────────────────
//  CLEAR CART
// ─────────────────────────────────────────────────────────────
document.getElementById("clear-btn").addEventListener("click", function () {
  for (var key in cart) {
    delete cart[key];
  }
  updateCartBadge();
  renderCartPanel();
  // Re-render products so qty buttons reset
  renderProducts(
    activeCategory,
    document.getElementById("search-input").value
  );
});


// ─────────────────────────────────────────────────────────────
//  WHATSAPP ORDER
// ─────────────────────────────────────────────────────────────
document.getElementById("wa-order-btn").addEventListener("click", function () {
  var name   = document.getElementById("c-name").value.trim();
  var phone  = document.getElementById("c-phone").value.trim();
  var place  = document.getElementById("c-place").value.trim();
  var entries = Object.entries(cart);

  if (entries.length === 0) {
    alert("Please add at least one product to your cart.");
    return;
  }

  if (!name || !phone || !place) {
    alert("Please fill in your name, phone number, and delivery location.");
    return;
  }

  var total = 0;
  var lines = entries.map(function (entry) {
    var idx     = entry[0];
    var qty     = entry[1];
    var product = PRODUCTS[idx];
    var sub     = product.price * qty;
    total += sub;
    return "• " + product.name + " × " + qty + " = ₹" + sub;
  });

  var message =
    "*New Order – Kalaivani Stores*\n\n" +
    "*Name:* " + name + "\n" +
    "*Phone:* " + phone + "\n" +
    "*Delivery:* " + place + "\n\n" +
    "*Items:*\n" + lines.join("\n") + "\n\n" +
    "*Total: ₹" + total + "*\n\n" +
    "Please confirm this order. Thank you!";

  var link = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  window.open(link, "_blank");
});


// ─────────────────────────────────────────────────────────────
//  CATEGORY TABS
// ─────────────────────────────────────────────────────────────
var activeCategory = "All";

document.getElementById("cat-bar").addEventListener("click", function (event) {
  var tab = event.target.closest(".cat-tab");
  if (!tab) return;

  // Remove active from all tabs, add to clicked one
  document.querySelectorAll(".cat-tab").forEach(function (t) {
    t.classList.remove("active");
  });
  tab.classList.add("active");

  activeCategory = tab.dataset.cat;

  document.getElementById("section-title").textContent =
    activeCategory === "All" ? "All Products" : activeCategory;

  renderProducts(activeCategory, document.getElementById("search-input").value);
});


// ─────────────────────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────────────────────
document.getElementById("search-input").addEventListener("input", function (event) {
  renderProducts(activeCategory, event.target.value);
});


// ─────────────────────────────────────────────────────────────
//  START — render all products when page loads
// ─────────────────────────────────────────────────────────────
renderProducts("All", "");
