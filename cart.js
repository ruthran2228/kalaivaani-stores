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

  async function ensureProducts() {
    let list = getCachedProducts();
    if (!list.length && supabaseClient) {
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
    PRODUCTS = list;
  }

  function renderCart() {
    const listBox = $("cart-list");
    const emptyBox = $("cart-empty");
    const card = $("checkout-card");
    const entries = Object.entries(cart)
      .map(([idx, qty]) => ({ idx: Number(idx), qty }))
      .filter((row) => PRODUCTS[row.idx]);

    const hasItems = entries.length > 0;
    if (emptyBox) emptyBox.hidden = hasItems;
    if (card) card.hidden = !hasItems;

    if (listBox) {
      listBox.innerHTML = hasItems
        ? entries
            .map(({ idx, qty }) => {
              const p = PRODUCTS[idx];
              return `
            <div class="cart-row" data-idx="${idx}">
              <div class="cart-row-emoji">${p.emoji || "🛒"}</div>
              <div class="cart-row-info">
                <strong>${esc(p.name)}</strong>
                <small>${money(p.price)} · ${esc(p.unit || "")}</small>
                <div class="cart-row-qty">
                  <button type="button" class="ci-btn" data-idx="${idx}" data-action="dec" aria-label="Decrease quantity">−</button>
                  <span>${qty}</span>
                  <button type="button" class="ci-btn" data-idx="${idx}" data-action="inc" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div class="cart-row-right">
                <strong class="cart-row-sub">${money(p.price * qty)}</strong>
                <button type="button" class="cart-row-remove" data-idx="${idx}" data-action="remove" aria-label="Remove item">×</button>
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
    if ($("cart-count")) {
      $("cart-count").textContent = `${items} item${items === 1 ? "" : "s"}`;
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

  function setQty(idx, qty) {
    qty = Math.max(0, Number(qty) || 0);
    if (qty === 0) delete cart[idx];
    else cart[idx] = qty;
    saveCart(cart);
    renderCart();
    renderDelivery();
  }

  // ------------------------------------------------------------
  // Order placement
  // ------------------------------------------------------------
  function buildOrderItems() {
    return Object.entries(cart)
      .map(([idx, qty]) => {
        const product = PRODUCTS[Number(idx)];
        if (!product) return null;
        return {
          name: product.name,
          qty,
          price: product.price,
          total: Number((product.price * qty).toFixed(2))
        };
      })
      .filter(Boolean);
  }

  async function placeOrder() {
    const { total, items } = getCartTotals(cart, PRODUCTS);

    if (items === 0) {
      showToast("Please add at least one product.");
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

    // Success — clear the cart and show the confirmation screen
    cart = {};
    saveCart(cart);
    renderCart();
    renderDelivery();

    showOrderConfirmation({
      orderNumber,
      name,
      phone,
      place: deliveryAddress,
      items: orderItems,
      total
    });
  }

  // ------------------------------------------------------------
  // Order confirmation screen
  // ------------------------------------------------------------
  function showOrderConfirmation(order) {
    const overlay = $("order-confirm-overlay");
    if (!overlay) return;

    try {
      const itemRows = order.items
        .map(
          (it) => `
        <div class="oc-item">
          <span>${esc(it.name)} × ${it.qty}</span>
          <strong>${money(it.total)}</strong>
        </div>`
        )
        .join("");

      $("oc-name").textContent = order.name;
      $("oc-phone").textContent = order.phone;
      $("oc-place").textContent = order.place;
      $("oc-items").innerHTML = itemRows;
      $("oc-total").textContent = money(order.total);

      const ring = overlay.querySelector(".oc-ring-circle");
      const tick = overlay.querySelector(".oc-tick");
      if (ring) ring.classList.remove("drawn");
      if (tick) tick.classList.remove("drawn");
      if (ring) void ring.getBoundingClientRect();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ring) ring.classList.add("drawn");
          if (tick) tick.classList.add("drawn");
        });
      });

      revealOrderNumber($("oc-number"), order.orderNumber, 900);

      $("oc-track-btn").onclick = () => {
        window.location.href =
          "orders.html?track=" + encodeURIComponent(order.orderNumber);
      };
    } catch (error) {
      console.warn("Confirmation content failed:", error);
    }

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    try {
      renderUpiPayment(order);
    } catch (error) {
      console.warn("Payment render failed:", error);
    }
  }

  function buildUpiUri(amount, orderNumber) {
    const vpa = (typeof UPI_ID === "string" ? UPI_ID : "").trim();
    if (!vpa) return null;

    const params = new URLSearchParams({
      pa: vpa,
      pn: typeof STORE_UPI_NAME === "string" ? STORE_UPI_NAME : "Kalaivani Stores",
      am: Number(amount).toFixed(2),
      cu: "INR",
      tn: "Order " + orderNumber,
      mode: "02"
    });

    return "upi://pay?" + params.toString();
  }

  function renderUpiPayment(order) {
    const payCard = $("oc-pay");
    const qrBox = $("oc-qr");
    const btn = $("oc-pay-btn");
    const vpaEl = $("oc-vpa");
    const amountEl = $("oc-pay-amount");
    if (!payCard) return;

    const uri = buildUpiUri(order.total, order.orderNumber);
    const qrImg = (typeof UPI_QR_IMAGE === "string" ? UPI_QR_IMAGE : "").trim();
    if (qrBox) qrBox.innerHTML = "";
    if (btn) btn.href = uri;

    if (!uri && !qrImg) {
      payCard.style.display = "none";
      return;
    }

    payCard.style.display = "block";

    if (amountEl) amountEl.textContent = "₹" + Number(order.total).toFixed(2);

    if (qrImg) {
      if (btn) btn.style.display = "none";
      if (vpaEl) vpaEl.textContent = UPI_QR_AMOUNT_NOTE || "Open any UPI app and scan this QR.";
    } else {
      const vpa = (typeof UPI_ID === "string" ? UPI_ID : "").trim();
      if (btn) btn.style.display = "";
      if (vpaEl) vpaEl.textContent = vpa || (typeof UPI_QR_AMOUNT_NOTE === "string" ? UPI_QR_AMOUNT_NOTE : "");
      if (btn && !vpa) btn.style.display = "none";
    }

    try {
      if (qrImg) {
        const img = document.createElement("img");
        img.src = qrImg;
        img.alt = "Scan to pay with UPI";
        img.className = "pay-qr-img";
        img.loading = "lazy";
        img.onerror = () => {
          if (btn) btn.style.display = "";
          if (vpaEl) vpaEl.textContent = (typeof UPI_ID === "string" ? UPI_ID : "").trim();
          implodePayHtml(qrBox, btn, uri);
        };
        if (qrBox) qrBox.appendChild(img);
      } else if (typeof QRCode === "function" && qrBox) {
        const canvas = document.createElement("canvas");
        QRCode.toCanvas(canvas, uri, {
          width: 168,
          margin: 1,
          color: { dark: "#062d19", light: "#ffffff" }
        })
          .then(() => {
            qrBox.appendChild(canvas);
          })
          .catch(() => {});
      }
    } catch (error) {
      console.warn("QR render failed:", error);
    }

    if (btn && !qrImg && uri) {
      btn.onclick = (event) => {
        event.preventDefault();
        window.location.href = uri;
      };
    }
  }

  function implodePayHtml(qrBox, btn, uri) {
    if (!qrBox || !uri || typeof QRCode !== "function") return;
    qrBox.innerHTML = "";
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, uri, {
      width: 168,
      margin: 1,
      color: { dark: "#062d19", light: "#ffffff" }
    })
      .then(() => {
        qrBox.appendChild(canvas);
      })
      .catch(() => {});
    if (btn) btn.style.display = "";
  }

  let __revealId = 0;
  function revealOrderNumber(el, finalText, duration) {
    const id = ++__revealId;
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const start = performance.now();
    const frame = (now) => {
      if (id !== __revealId) return;
      const t = Math.min((now - start) / duration, 1);
      const settled = Math.floor(t * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        out += i < settled ? finalText[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function closeOrderConfirmation() {
    const overlay = $("order-confirm-overlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  // ------------------------------------------------------------
  // Events
  // ------------------------------------------------------------
  $("cart-list").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-idx][data-action]");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    if (btn.dataset.action === "remove") {
      setQty(idx, 0);
      showToast("Item removed");
    } else {
      setQty(idx, (cart[idx] || 0) + (btn.dataset.action === "inc" ? 1 : -1));
    }
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

  const ocBg = $("oc-bg");
  if (ocBg) ocBg.addEventListener("click", closeOrderConfirmation);

  const logoutBtn = $("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOrderConfirmation();
  });

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

    const lo = $("logout-btn");
    if (lo) lo.hidden = false;

    renderCart();
    renderDelivery();
    bindDeliveryEvents();

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