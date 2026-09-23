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
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
} catch (error) {
  console.warn("Supabase init failed:", error);
}

const $ = (id) => document.getElementById(id);

let authMode = "signin";
let currentUser = null;
let currentOrders = [];
let deepLinkOrder = null;

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

// ------------------------------------------------------------
// Views
// ------------------------------------------------------------
function showView(name) {
  $("auth-view").hidden = name !== "auth";
  $("history-view").hidden = name !== "history";
  $("track-view").hidden = name !== "track";
}

// ------------------------------------------------------------
// Auth flow
// ------------------------------------------------------------
document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    authMode = tab.dataset.mode;
    document.querySelectorAll(".auth-tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
    });
    $("name-field").hidden = authMode !== "signup";
    $("auth-btn").textContent = authMode === "signup" ? "Create account" : "Sign in";
    $("auth-pass").autocomplete = authMode === "signup" ? "new-password" : "current-password";
    $("auth-hint").hidden = true;
    $("auth-error").hidden = true;
  });
});

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("auth-error").hidden = true;
  $("auth-hint").hidden = true;

  const email = $("auth-email").value.trim();
  const password = $("auth-pass").value;

  if (!email || !password) {
    showAuthError("Enter your email and password.");
    return;
  }

  if (authMode === "signup") {
    if (password.length < 6) {
      showAuthError("Password must be at least 6 characters.");
      return;
    }
  }

  const btn = $("auth-btn");
  btn.disabled = true;
  btn.textContent = authMode === "signup" ? "Creating account…" : "Signing in…";

  let error = null;

  if (authMode === "signup") {
    const res = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name: $("auth-name").value.trim() || null }
      }
    });
    error = res.error;

    if (!error && (!res.data.user || (res.data.user.identities && res.data.user.identities.length === 0))) {
      btn.disabled = false;
      btn.textContent = "Create account";
      const hint = $("auth-hint");
      hint.innerHTML =
        "Account created! A confirmation link was sent to <strong>" +
        esc(email) +
        "</strong>. Open it, then sign in here.";
      hint.hidden = false;
      authMode = "signin";
      document.querySelectorAll(".auth-tab").forEach((t) => {
        t.classList.toggle("active", t.dataset.mode === "signin");
      });
      $("name-field").hidden = true;
      $("auth-btn").textContent = "Sign in";
      return;
    }
  } else {
    const res = await supabaseClient.auth.signInWithPassword({ email, password });
    error = res.error;
  }

  btn.disabled = false;
  btn.textContent = authMode === "signup" ? "Create account" : "Sign in";

  if (error) {
    showAuthError(error.message);
    showEmailConfirmHelp(error);
    return;
  }
});

function showAuthError(message) {
  const err = $("auth-error");
  err.textContent = message;
  err.hidden = false;
}

function showEmailConfirmHelp(error) {
  const msg = String(error.code + " " + error.message).toLowerCase();
  const hint = $("auth-hint");
  if (!hint) return;

  if (msg.includes("email not confirmed")) {
    hint.innerHTML =
      "Your email has not been confirmed yet. Check your inbox for the link we sent, " +
      "or the shop can confirm it in <strong>Supabase → Authentication → Users</strong>.";
    hint.hidden = false;
    return;
  }

  if (msg.includes("invalid login")) {
    hint.innerHTML =
      "No account with this password. If you haven't created an account yet, use the " +
      "<strong>Create account</strong> tab.";
    hint.hidden = false;
  }
}

$("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
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
});

// ------------------------------------------------------------
// Authenticated: history + track
// ------------------------------------------------------------
async function bootLoggedIn(user) {
  currentUser = user;
  $("logout-btn").hidden = false;

  await loadOrders();

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

function showHistoryView() {
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
        <span>${esc(it.name || "Item")} × ${it.qty ?? 1}</span>
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
    showAuthError("Orders are unavailable right now. Please try again later.");
    return;
  }

  readParams();

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") window.location.assign("./orders.html");
  });

  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    bootLoggedIn(data.session.user);
  } else {
    // Deep link from the order confirmation: prefill the guest form.
    if (deepLinkOrder) {
      $("guest-number").value = deepLinkOrder;
      $("guest-form").hidden = false;
    }
    showView("auth");
  }
}

init();