// ------------------------------------------------------------
// Kalaivani Stores — Order confirmation page
// Renders the most recent placed order from localStorage and
// surfaces the UPI payment block. cart.js redirects here after
// a successful order via order-confirm.html?order=<number>.
// ------------------------------------------------------------
(function initOrderConfirmPage() {
  if (!document.getElementById("oc-confirm")) return;

  const $ = (id) => document.getElementById(id);
  const LAST_ORDER_KEY = "ks_last_order";

  function readLastOrder() {
    try {
      const raw = localStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return null;
      const order = JSON.parse(raw);
      return order && order.orderNumber ? order : null;
    } catch (error) {
      return null;
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
          renderGeneratedQr(qrBox, btn, uri);
        };
        if (qrBox) qrBox.appendChild(img);
      } else if (typeof QRCode === "function" && qrBox) {
        renderGeneratedQr(qrBox, btn, uri);
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

  function renderGeneratedQr(qrBox, btn, uri) {
    if (!qrBox || !uri || typeof QRCode !== "function") return;
    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, uri, {
      width: 168,
      margin: 1,
      color: { dark: "#062d19", light: "#ffffff" }
    })
      .then(() => {
        qrBox.appendChild(canvas);
      })
      .catch(() => {
        if (btn) btn.style.display = "";
      });
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

  function drawTick() {
    const ring = document.querySelector(".oc-ring-circle");
    const tick = document.querySelector(".oc-tick");
    if (!ring || !tick) return;
    ring.classList.remove("drawn");
    tick.classList.remove("drawn");
    void ring.getBoundingClientRect();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.classList.add("drawn");
        tick.classList.add("drawn");
      });
    });
  }

  function showFallback() {
    const card = $("oc-confirm");
    const empty = $("oc-empty");
    if (card) card.hidden = true;
    if (empty) empty.hidden = false;
  }

  function confirm() {
    const order = readLastOrder();
    if (!order) {
      showFallback();
      return;
    }

    $("oc-confirm").hidden = false;
    $("oc-empty").hidden = true;

    const itemRows = (order.items || [])
      .map(
        (it) => `
      <div class="oc-item">
        <span>${esc(it.name)} × ${it.qty}</span>
        <strong>${money(it.total)}</strong>
      </div>`
      )
      .join("");

    $("oc-name").textContent = order.name || "";
    $("oc-phone").textContent = order.phone || "";
    $("oc-place").textContent = order.place || "";
    $("oc-items").innerHTML = itemRows;
    $("oc-total").textContent = money(order.total);

    drawTick();
    revealOrderNumber($("oc-number"), order.orderNumber, 900);

    $("oc-track-btn").onclick = () => {
      window.location.href =
        "orders.html?track=" + encodeURIComponent(order.orderNumber);
    };

    const copyBtn = $("oc-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const number = order.orderNumber;
        try {
          await navigator.clipboard.writeText(number);
        } catch (err) {
          const ta = document.createElement("textarea");
          ta.value = number;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
          } catch (err2) {
            /* clipboard unavailable */
          }
          ta.remove();
        }
        copyBtn.classList.add("copied");
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.textContent = "Copy number";
        }, 1600);
      });
    }

    renderUpiPayment(order);
  }

  confirm();
})();