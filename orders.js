// ============================================================
// Kalaivani Stores — My Orders page
// Auth (supabase) + order history + tracking + payment
// ============================================================

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

const $ = (id) => document.getElementById(id);

let currentUser = null;
let currentOrders = [];
let deepLinkOrder = null;
let ordersChannel = null;
let currentTrackOrder = null;
let guestPollTimer = null;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
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

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function statusLabel(status) {
  return (
    {
      new: "Placed",
      confirmed: "Confirmed",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
      cancelled: "Cancelled"
    }[status] || "Placed"
  );
}

function statusIcon(status) {
  return (
    {
      new: "🕒",
      confirmed: "👍",
      out_for_delivery: "🛵",
      delivered: "✅",
      cancelled: "✕"
    }[status] || "🕒"
  );
}

function firstUppercase(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}

// Right after OTP verification the session can still be settling into
// storage — retry briefly before assuming the user is logged out.
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
// Views
// ------------------------------------------------------------
function showView(name) {
  $("history-view").hidden = name !== "history";
  $("track-view").hidden = name !== "track";
}

// ------------------------------------------------------------
// Log out
// ------------------------------------------------------------
$("logout-btn").addEventListener("click", async () => {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.warn("signOut failed:", error);
  }
  window.location.replace(new URL("login.html", window.location.href).href);
});

// ------------------------------------------------------------
// Guest tracking (works for older orders made without an account)
// ------------------------------------------------------------
$("guest-toggle").addEventListener("click", () => {
  const form = $("guest-form");
  form.hidden = !form.hidden;
  if (!form.hidden) $("guest-number").focus();
});

$("guest-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const orderNumber = $("guest-number").value.trim();
  const phone = $("guest-phone").value.trim();

  const box = $("guest-result");

  if (!orderNumber || !phone) {
    box.innerHTML = `<p class="track-error">Enter your order number and phone number.</p>`;
    return;
  }

  box.innerHTML = `<p class="track-loading">Looking up your order…</p>`;

  const { data, error } = await supabaseClient.rpc("get_order_status", {
    p_order_number: orderNumber,
    p_phone: phone
  });

  if (error) {
    console.warn("Track error:", error.message);
    box.innerHTML = `<p class="track-error">Could not check your order. Please try again.</p>`;
    return;
  }

  const order = Array.isArray(data) ? data[0] : data;

  if (!order || !order.order_number) {
    box.innerHTML = `<p class="track-error">No order found. Check the order number and phone number and try again.</p>`;
    return;
  }

  box.innerHTML = `<div class="guest-result">${renderTrackCard(order)}</div>`;
  renderPayBox(order, box);

  // Guests can't get Realtime pushes (they're anonymous), so quietly
  // re-check every 15s while the result stays on screen.
  clearInterval(guestPollTimer);
  guestPollTimer = setInterval(async () => {
    const historyVisible = !!$("history-view") && !$("history-view").hidden;
    if (!historyVisible || box.hidden || !document.body.contains(box)) {
      clearInterval(guestPollTimer);
      guestPollTimer = null;
      return;
    }
    const { data: fresh } = await supabaseClient.rpc("get_order_status", {
      p_order_number: orderNumber,
      p_phone: phone
    });
    const updated = Array.isArray(fresh) ? fresh[0] : fresh;
    if (!updated || !updated.order_number) return;
    if (updated.status === "delivered" || updated.status === "cancelled") {
      clearInterval(guestPollTimer);
      guestPollTimer = null;
    }
    renderTrackCardInto(updated, box, orderNumber);
  }, 15000);
});

// ------------------------------------------------------------
// Authenticated: history + track
// ------------------------------------------------------------
async function bootLoggedIn(user) {
  currentUser = user;
  $("logout-btn").hidden = false;

  await loadOrders();
  subscribeToOrders();

  if (deepLinkOrder) {
    const found = currentOrders.find((o) => o.order_number === deepLinkOrder);
    if (found) {
      showTrackView(found);
    } else {
      $("track-current").innerHTML =
        `<div class="track-card"><p class="track-error">We couldn't find order ${esc(
          deepLinkOrder
        )} on this account.</p></div>`;
      showView("track");
    }
    return;
  }

  showHistoryView();
}

async function loadOrders() {
  if (!supabaseClient || !currentUser) return;

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadOrders error", error);
    currentOrders = [];
    return;
  }

  currentOrders = data || [];
}

// ------------------------------------------------------------
// Realtime: receive order status updates instantly as the shop
// updates them (no manual refresh needed).
// ------------------------------------------------------------
function subscribeToOrders() {
  if (!supabaseClient || !currentUser) return;
  if (ordersChannel) return;

  const seen = new Set();

  ordersChannel = supabaseClient
    .channel("order-status-live")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${currentUser.id}`
      },
      (payload) => {
        const order = payload.new;
        const isOwnOrder =
          order &&
          currentOrders.some((o) => o.order_number === order.order_number);

        if (payload.eventType === "DELETE" || !order) return;

        const existing = currentOrders.find(
          (o) => o.order_number === order.order_number
        );
        const key = order.order_number + "-" + order.updated_at;

        let changed = false;
        if (existing) {
          changed =
            existing.status !== order.status ||
            existing.paid !== order.paid ||
            existing.updated_at !== order.updated_at;
          Object.assign(existing, order);
        } else {
          currentOrders.unshift(order);
          changed = true;
        }

        if (!changed || seen.has(key)) return;
        seen.add(key);
        setTimeout(() => seen.delete(key), 1500);

        if (isOwnOrder) {
          if (currentTrackOrder && currentTrackOrder.order_number === order.order_number) {
            showTrackView(Object.assign(currentTrackOrder, order));
          }
          $("orders-list").innerHTML = currentOrders
            .map((order) => renderOrderCard(order))
            .join("");
        }

        const label = statusLabel(order.status);
        showToast(`${order.order_number} — ${label}${order.paid ? " · Paid" : ""}`);
      }
    )
    .subscribe();
}

function showHistoryView() {
  $("track-own-btn").hidden = false;
  $("live-hint").hidden = false;

  $("hello-name").textContent = firstUppercase(
    (currentUser.user_metadata && currentUser.user_metadata.name) || currentUser.email || ""
  );

  $("history-count").textContent =
    currentOrders.length
      ? `${currentOrders.length} order${currentOrders.length === 1 ? "" : "s"} placed`
      : "Orders you place while signed in appear here.";

  const list = $("orders-list");
  list.innerHTML = currentOrders
    .map((order) => renderOrderCard(order))
    .join("");

  $("history-empty").hidden = currentOrders.length !== 0;
  showView("history");
}

function renderOrderCard(order) {
  const status = order.status || "new";
  const items = Array.isArray(order.items) ? order.items : [];
  const count = items.reduce((n, it) => n + (Number(it.qty) || 1), 0);

  return `
    <button class="order-card" data-order="${esc(order.order_number)}" type="button">
      <div class="order-top">
        <div>
          <div class="order-num">${esc(order.order_number)}</div>
          <div class="order-date">${new Date(order.created_at).toLocaleString()}</div>
        </div>
        <span class="track-badge b-${status}">${esc(statusLabel(status))}</span>
      </div>
      <div class="order-mid">
        <span>🧺 ${items.length} item${items.length === 1 ? "" : " type"}</span>
        <span>·</span>
        <span>${count} pcs</span>
        ${order.paid ? `<span style="color:var(--green);font-weight:800">· Paid</span>` : ""}
      </div>
      <div class="order-bottom">
        <div class="order-total"><small>Total</small>${money(order.total)}</div>
        <span class="order-view">View & track →</span>
      </div>
    </button>`;
}

$("track-own-btn").addEventListener("click", () => {
  $("track-current").innerHTML = `
    <div class="track-card">
      <div class="seg-title">Track by order number</div>
      <div class="guest-form" id="own-track-form">
        <label>Order number
          <input id="own-number" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. KS-1A2B3C4D">
        </label>
        <button class="primary-btn" id="own-submit" type="button">Track order</button>
        <div id="own-result"></div>
      </div>
    </div>`;

  $("own-submit").addEventListener("click", async () => {
    const number = $("own-number").value.trim();
    const box = $("own-result");
    if (!number) {
      box.innerHTML = `<p class="track-error">Enter your order number.</p>`;
      return;
    }
    box.innerHTML = `<p class="track-loading">Looking up your order…</p>`;
    const found = currentOrders.find((o) => o.order_number === number);
    if (!found) {
      box.innerHTML = `<p class="track-error">No order found on this account with that number.</p>`;
      return;
    }
    showTrackView(found);
  });

  showView("track");
  $("own-number").focus();
});

$("back-to-list").addEventListener("click", () => {
  $("history-empty").hidden = currentOrders.length !== 0;
  $("orders-list").innerHTML = currentOrders.map((order) => renderOrderCard(order)).join("");
  showHistoryView();
});

// ------------------------------------------------------------
// Track view
// ------------------------------------------------------------
function showTrackView(order) {
  currentTrackOrder = order;
  $("track-current").innerHTML = renderTrackCard(order);
  renderPayBox(order);
  showView("track");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTrackCard(order) {
  const status = order.status || "new";
  const steps = ["new", "confirmed", "out_for_delivery", "delivered"];
  const currentIndex = steps.indexOf(status);
  const isCancelled = status === "cancelled";

  const itemRows = (Array.isArray(order.items) ? order.items : [])
    .map(
      (it) => `
      <div class="oc-item">
        <span>${esc(it.name || "Item")} × ${it.unit && isWeightUnit(it.unit) ? fmtQty(it.qty ?? 1) + " kg" : fmtQty(it.qty ?? 1)}</span>
        <strong>${money((it.price || 0) * (it.qty || 1))}</strong>
      </div>`
    )
    .join("");

  const timeline = isCancelled
    ? `
      <div class="tl-step done cancelled">
        <span class="tl-dot">✕</span>
        <div>
          <strong>Cancelled</strong>
          <small>${new Date(order.updated_at || order.created_at).toLocaleString()}</small>
        </div>
      </div>`
    : steps
        .map((step, i) => {
          const done = i <= currentIndex;
          const label = statusLabel(step);
          const time =
            i === 0
              ? order.created_at
              : i === currentIndex && i > 0
                ? order.updated_at
                : null;
          return `
        <div class="tl-step ${done && !isCancelled ? "done" : ""}">
          <span class="tl-line"></span>
          <span class="tl-dot">${done ? "✓" : i + 1}</span>
          <div>
            <strong>${label}</strong>
            ${time ? `<small>${new Date(time).toLocaleString()}</small>` : ""}
          </div>
        </div>`;
        })
        .join("");

  return `
    <div class="track-card status-${status}">
      <div class="status-hero">
        <span class="status-icon s-${status}">${statusIcon(status)}</span>
        <div>
          <h2>${esc(statusLabel(status))}</h2>
          <p>Order ${esc(order.order_number)} · placed ${new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div class="track-timeline">${timeline}</div>

      <div class="pay-status ${order.paid ? "" : "pending"}">
        ${order.paid ? "✅ Payment received" : "⏳ Payment pending"}${order.paid && order.paid_at ? `<small style="color:var(--muted);font-weight:700"> · ${new Date(order.paid_at).toLocaleString()}</small>` : ""}
      </div>

      ${order.delivery || order.phone ? `
      <div class="oc-delivery">
        <div class="oc-delivery-row">📍 <span>${esc(order.delivery || "Address not shared")}</span></div>
        ${order.phone ? `<div class="oc-delivery-row">📞 <span>${esc(order.phone)}</span></div>` : ""}
      </div>` : ""}

      <div class="track-divider"></div>
      <div class="seg-title">Items</div>
      ${itemRows || "<p style='color:var(--muted);font-size:13px'>No items.</p>"}
      <div class="oc-item oc-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>
    </div>`;
}

// ------------------------------------------------------------
// Payment (UPI QR) — same approach as the store confirmation
// ------------------------------------------------------------
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

// Refresh an order card that's already on the page (guest tracking poll)
// without resetting scroll or the surrounding view.
function renderTrackCardInto(order, holder, orderNumber) {
  if (!holder) return;
  const oldCard = holder.querySelector(".track-card");
  if (!oldCard) return;
  const fresh = document.createElement("div");
  fresh.innerHTML = renderTrackCard(order);
  const newCard = fresh.querySelector(".track-card");
  if (!newCard) return;
  oldCard.replaceWith(newCard);
  renderPayBox(order, holder);
  showToast(`${orderNumber} — ${statusLabel(order.status)} updated`);
}

function renderPayBox(order, scope) {
  if (!order || order.paid) return;

  const holder = scope || $("track-current");
  const cardHolder = holder.querySelector(".track-card");
  if (!cardHolder) return;

  const existing = cardHolder.querySelector(".pay-box");
  if (existing) existing.remove();

  const box = document.createElement("div");
  box.className = "pay-box";
  box.innerHTML = `
    <div class="pay-head"><span>💳</span>Pay with UPI</div>
    <div class="pay-amount">${money(order.total)}</div>
    <div class="pay-qr" data-pay-qr></div>
    <a class="pay-upi-btn" data-pay-btn href="#" rel="noopener">Pay with UPI app</a>
    <small class="pay-vpa" data-pay-vpa></small>
    <small class="pay-note">The shop updates your order once the payment is received.</small>
  `;
  cardHolder.appendChild(box);

  const qrBox = box.querySelector("[data-pay-qr]");
  const btn = box.querySelector("[data-pay-btn]");
  const vpaEl = box.querySelector("[data-pay-vpa]");
  const uri = buildUpiUri(order.total, order.order_number);
  const qrImg = (typeof UPI_QR_IMAGE === "string" ? UPI_QR_IMAGE : "").trim();
  if (btn) btn.href = uri;
  const vpa = (typeof UPI_ID === "string" ? UPI_ID : "").trim();

  if (qrImg) {
    btn.style.display = "none";
    vpaEl.textContent = UPI_QR_AMOUNT_NOTE || "Open any UPI app and scan this QR.";
  } else {
    btn.style.display = vpa ? "" : "none";
    vpaEl.textContent = vpa || (typeof UPI_QR_AMOUNT_NOTE === "string" ? UPI_QR_AMOUNT_NOTE : "");
  }

  if (qrImg) {
    const img = document.createElement("img");
    img.src = qrImg;
    img.alt = "Scan to pay with UPI";
    img.loading = "lazy";
    img.onerror = () => {
      btn.style.display = vpa && uri ? "" : "none";
      vpaEl.textContent = vpa;
      genQr(qrBox, uri);
    };
    qrBox.appendChild(img);
  } else if (typeof QRCode === "function" && uri) {
    genQr(qrBox, uri);
  }

  if (btn && uri) {
    btn.onclick = (event) => {
      event.preventDefault();
      window.location.href = uri;
    };
  }
}

function genQr(qrBox, uri) {
  try {
    qrBox.innerHTML = "";
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, uri, {
      width: 168,
      margin: 1,
      color: { dark: "#062d19", light: "#ffffff" }
    }).then(() => {
      qrBox.appendChild(canvas);
    }).catch(() => {});
  } catch (err) {
    console.warn("QR render failed:", err);
  }
}

// ------------------------------------------------------------
// Event delegation on the orders list
// ------------------------------------------------------------
$("orders-list").addEventListener("click", (event) => {
  const card = event.target.closest("[data-order]");
  if (!card) return;
  const found = currentOrders.find((o) => o.order_number === card.dataset.order);
  if (found) showTrackView(found);
});

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
function readParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const track = params.get("track");
    if (track) deepLinkOrder = track.trim().toUpperCase();
  } catch (error) {
    /* ignore */
  }
}

async function init() {
  if (!supabaseClient) {
    window.location.replace(
      new URL("login.html", window.location.href).href
    );
    return;
  }

  readParams();

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" && !session) {
      window.location.replace(
        new URL("login.html", window.location.href).href
      );
    }
  });

  const session = await getSessionReady(supabaseClient);

  if (session) {
    bootLoggedIn(session.user);
  } else {
    // Not signed in → send them to the login gate, then back here
    // (preserving any ?track= deep link).
    const here = window.location.pathname + window.location.search;
    const url = new URL("login.html", window.location.href);
    url.searchParams.set("next", here);
    window.location.replace(url.toString());
  }
}

init();