// ------------------------------------------------------------
// Kalaivani Stores — Cart page
// Full-page cart: saved profile used for delivery details.
// ------------------------------------------------------------
(function initCartPage() {
  if (!document.getElementById("cart-app")) return;

  const $ = (id) => document.getElementById(id);

  let PRODUCTS = [];
  let cart = loadCart();
  let profile = null;
  let shopClosed = false;
  let shopClosedMsg = "";
  let selectedAddrId =
    localStorage.getItem("ks_selected_addr") || "";

  function redirectToLogin() {
    const url = new URL("login.html", window.location.href);
    url.searchParams.set(
      "next",
      window.location.pathname + window.location.search
    );
    window.location.replace(url.toString());
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function showClosedNotice() {
    const app = $("cart-app");
    if (!app || app.querySelector(".closed-notice")) return;
    const box = document.createElement("div");
    box.className = "closed-notice";
    box.textContent =
      "🕐 " +
      (shopClosedMsg ||
        "The store is temporarily closed. You can still view your cart, but ordering is paused.");
    app.insertBefore(box, app.firstChild);

    // Actually disable ordering — a toast after a failed click is too late.
    const btn = $("place-order-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "🕐 Store closed";
    }
    const clear = $("clear-btn");
    if (clear) clear.hidden = true;
  }

  async function ensureProducts() {
    // Always prefer a fresh catalog: prices/stock must be current at
    // checkout, and cart keys must resolve against the live list.
    let list = [];
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true, nullsFirst: false });
        if (!error && data && data.length) {
          list = normalizeProducts(data);
          try {
            localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(list));
          } catch (err) {
            /* storage unavailable */
          }
        }
      } catch (error) {
        console.warn("Product fetch failed:", error);
      }
    }
    if (!list.length) list = getCachedProducts();

    PRODUCTS = list;
    if (migrateCartKeys(cart, PRODUCTS, true)) saveCart(cart);
  }

  function renderCart() {
    const listBox = $("cart-list");
    const emptyBox = $("cart-empty");
    const card = $("checkout-card");
    const byKey = productMap(PRODUCTS);
    const entries = Object.entries(cart)
      .map(([key, qty]) => ({ key, qty: Number(qty) || 0, p: byKey.get(key) }))
      .filter((row) => row.p);

    const hasItems = entries.length > 0;
    if (emptyBox) emptyBox.hidden = hasItems;
    if (card) card.hidden = !hasItems;

    if (listBox) {
      listBox.innerHTML = hasItems
        ? entries
            .map(({ key, qty, p }) => {
              const weight = isWeightUnit(p.unit);
              const oos = p.in_stock === false;
              return `
            <div class="cart-row${oos ? " row-oos" : ""}" data-key="${esc(key)}">
              <div class="cart-row-emoji">${p.emoji || "🛒"}</div>
              <div class="cart-row-info">
                <strong>${esc(p.name)}</strong>
                ${oos ? '<span class="ci-oos">Sold out</span>' : ""}
                <small>${money(p.price)} · ${esc(p.unit || "")}</small>
                <div class="cart-row-qty">
                  <button type="button" class="ci-btn" data-key="${esc(key)}" data-action="dec" aria-label="Decrease quantity">−</button>
                  <div class="ci-field">
                    <input type="number" inputmode="decimal" class="ci-input" data-key="${esc(key)}" min="0" step="${weight ? "0.25" : "1"}" value="${fmtQty(qty)}" aria-label="Quantity">
                    ${weight ? '<em class="ci-unit">kg</em>' : ""}
                  </div>
                  <button type="button" class="ci-btn" data-key="${esc(key)}" data-action="inc" aria-label="Increase quantity" ${oos ? "disabled" : ""}>+</button>
                </div>
              </div>
              <div class="cart-row-right">
                <strong class="cart-row-sub">${money(p.price * qty)}</strong>
                <button type="button" class="cart-row-remove" data-key="${esc(key)}" data-action="remove" aria-label="Remove item">×</button>
              </div>
            </div>`;
            })
            .join("")
        : "";
    }

    updateTotals();
  }

  function updateTotals() {
    const { items, total } = getCartTotals(cart, PRODUCTS);
    const count = roundQty(items);
    if ($("cart-count")) {
      $("cart-count").textContent = `${fmtQty(items)} item${count === 1 ? "" : "s"}`;
    }
    const totalEl = $("cart-total");
    if (totalEl) totalEl.textContent = money(total);
  }

  function selectedAddress() {
    if (!profile) return null;
    const list = profile.addresses || [];
    return (
      list.find((a) => a.id === selectedAddrId) ||
      list.find((a) => a.id === localStorage.getItem("ks_selected_addr")) ||
      list[0] ||
      null
    );
  }

  function renderDelivery() {
    const box = $("delivery-details");
    if (!box) return;

    const name = (profile && profile.name) || "";
    const phone = (profile && profile.phone) || "";
    const list = (profile && profile.addresses) || [];
    const chosen = selectedAddress();

    const missing = !name || !phone || !list.length;

    if (missing) {
      box.innerHTML = `
        <div class="profile-prompt">
          <div class="extra-icon" aria-hidden="true">📍</div>
          <strong>Set up your delivery details</strong>
          <p>Add your delivery address once and it will be saved to your account for every order.</p>
          <a class="primary-btn" href="profile.html?next=cart.html">Set up profile</a>
        </div>`;
      return;
    }

    box.innerHTML = `
      <div class="profile-line">
        <div>
          <strong>${esc(name)}</strong>
          <span>${esc(phone)}</span>
        </div>
        <a href="profile.html?next=cart.html">Edit</a>
      </div>
      <div class="addr-picker">
        ${list
          .map((addr) => {
            const active = chosen && chosen.id === addr.id;
            return `
            <label class="addr-option${active ? " active" : ""}">
              <input type="radio" name="addr" value="${esc(addr.id)}"${active ? " checked" : ""}>
              <span class="addr-option-body">
                <strong>${esc(addr.label)}</strong>
                <small>${esc(fmtAddress(addr))}</small>
              </span>
            </label>`;
          })
          .join("")}
      </div>
      <a class="addr-manage" href="profile.html?next=cart.html">+ Add or change addresses</a>`;
  }

  function bindDeliveryEvents() {
    const box = $("delivery-details");
    if (!box) return;
    box.addEventListener("change", (event) => {
      const radio = event.target.closest('input[name="addr"]');
      if (!radio) return;
      selectedAddrId = radio.value;
      try {
        localStorage.setItem("ks_selected_addr", selectedAddrId);
      } catch (err) {
        /* ignore */
      }
      box.querySelectorAll(".addr-option").forEach((el) => {
        el.classList.toggle("active", el.querySelector("input").checked);
      });
    });
  }

  function setQty(key, qty) {
    qty = Math.max(0, Number(qty) || 0);
    if (qty === 0) delete cart[key];
    else cart[key] = qty;
    saveCart(cart);
    renderCart();
    renderDelivery();
  }

  function productByKey(key) {
    return productMap(PRODUCTS).get(key) || null;
  }

  // ------------------------------------------------------------
  // Order placement
  // ------------------------------------------------------------
  function buildOrderItems() {
    const byKey = productMap(PRODUCTS);
    return Object.entries(cart)
      .map(([key, qty]) => {
        const product = byKey.get(key);
        if (!product) return null;
        const q = Number(qty) || 0;
        if (q <= 0) return null;
        return {
          // Stable id so the server can validate price/stock itself
          product_id: product.id != null ? product.id : null,
          name: product.name,
          qty: q,
          price: product.price,
          unit: product.unit,
          total: Number((product.price * q).toFixed(2))
        };
      })
      .filter(Boolean);
  }

  async function placeOrder() {
    if (shopClosed) {
      showToast("The store is temporarily closed. Please try again later.");
      return;
    }

    const { total, items } = getCartTotals(cart, PRODUCTS);

    if (items === 0) {
      showToast("Please add at least one product.");
      return;
    }

    const byKey = productMap(PRODUCTS);
    const oosLine = Object.keys(cart)
      .map((key) => byKey.get(key))
      .find((p) => p && p.in_stock === false);
    if (oosLine) {
      showToast(`${oosLine.name} is sold out — remove it from your cart first.`);
      return;
    }

    const chosen = selectedAddress();
    const name = (profile && profile.name) || "";
    const phone = (profile && profile.phone) || "";

    if (!name || !phone || !chosen) {
      showToast("Please set up your delivery details first.");
      return;
    }

    const orderItems = buildOrderItems();
    const orderNumber = makeOrderNumber();
    const deliveryAddress =
      (chosen.label ? chosen.label + ": " : "") + fmtAddress(chosen);

    const btn = $("place-order-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Placing order…";
    }

    try {
      const userData = await supabaseClient.auth.getUser();
      const userId = userData && userData.data && userData.data.user
        ? userData.data.user.id
        : null;

      const { error } = userId
        ? await supabaseClient.from("orders").insert({
            customer_name: name,
            phone,
            delivery: deliveryAddress,
            items: orderItems,
            total,
            order_number: orderNumber,
            user_id: userId
          })
        : { error: { message: "Not signed in" } };

      if (error) {
        console.warn("Could not save order:", error.message);
        showToast("Order failed to send. Please try again.");
        return;
      }
    } catch (error) {
      console.warn("Order insert failed:", error);
      showToast("Order failed to send. Please try again.");
      return;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "📦 Place order";
      }
    }

    // Success — clear the cart, remember this order for the
    // confirmation page, then redirect there.
    cart = {};
    saveCart(cart);
    renderCart();
    renderDelivery();

    try {
      localStorage.setItem(
        "ks_last_order",
        JSON.stringify({
          orderNumber,
          name,
          phone,
          place: deliveryAddress,
          items: orderItems,
          total
        })
      );
    } catch (error) {
      /* storage unavailable — confirmation page falls back */
    }

    window.location.assign(
      "order-confirm.html?order=" + encodeURIComponent(orderNumber)
    );
  }

  // ------------------------------------------------------------
  // Events
  // ------------------------------------------------------------
  $("cart-list").addEventListener("click", (event) => {
    const btn = event.target.closest(".ci-btn, .cart-row-remove");
    if (!btn) return;
    const key = btn.dataset.key;
    const product = productByKey(key);
    if (btn.dataset.action === "remove") {
      setQty(key, 0);
      showToast("Item removed");
      return;
    }
    if (btn.dataset.action === "inc" && product && product.in_stock === false) {
      showToast("This item is sold out.");
      return;
    }
    const step = product && isWeightUnit(product.unit) ? 0.5 : 1;
    const next = roundQty((Number(cart[key]) || 0) + (btn.dataset.action === "inc" ? step : -step));
    setQty(key, Math.max(0, next));
  });

  $("cart-list").addEventListener("change", (event) => {
    const input = event.target.closest(".ci-input");
    if (!input) return;
    const key = input.dataset.key;
    const val = Math.max(0, roundQty(Number(input.value) || 0));
    input.value = val ? fmtQty(val) : "1";
    setQty(key, val);
  });

  const clearBtn = $("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!Object.keys(cart).length) {
        showToast("Cart is already empty");
        return;
      }
      if (!window.confirm("Clear your cart?")) return;
      cart = {};
      saveCart(cart);
      renderCart();
      renderDelivery();
      showToast("Cart cleared");
    });
  }

  const placeBtn = $("place-order-btn");
  if (placeBtn) placeBtn.addEventListener("click", placeOrder);

  const logoutBtn = $("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
    });
  }

  // ------------------------------------------------------------
  // Init
  // ------------------------------------------------------------
  async function start() {
    if (!supabaseClient) {
      redirectToLogin();
      return;
    }
    const session = await getSessionReady(supabaseClient);
    if (!session) {
      redirectToLogin();
      return;
    }

    await ensureProducts();
    profile = await getProfile();

    try {
      const settings = await fetchShopSettings(supabaseClient);
      if (settings && settings.shop_open === false) {
        shopClosed = true;
        shopClosedMsg = settings.message || "";
        showClosedNotice();
      }
    } catch (error) {
      /* settings unavailable — treat shop as open */
    }

    const lo = $("logout-btn");
    if (lo) lo.hidden = false;

    renderCart();
    renderDelivery();
    bindDeliveryEvents();

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("reordered")) {
        window.history.replaceState({}, "", window.location.pathname);
        showToast("Items from your previous order were added to your cart.");
      }
    } catch (error) {
      /* ignore */
    }

    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" && !session) {
          window.location.replace("login.html");
        }
      });
    }
  }

  start();
})();