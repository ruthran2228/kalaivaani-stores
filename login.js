// ============================================================
// Kalaivani Stores — Login page (email OTP code)
// Two-step: (1) enter details → email 6-digit code,
//           (2) type code to verify → signed in.
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

// Where to go after signing in (default: the store).
function nextUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next) return new URL(next, window.location.href).href;
  } catch (error) {
    /* ignore */
  }
  return new URL("index.html", window.location.href).href;
}

let pendingEmail = "";

function showLoginError(message) {
  const err = $("login-error");
  err.textContent = message;
  err.hidden = false;
}

function showLoginHint(html) {
  const hint = $("login-hint");
  hint.innerHTML = html;
  hint.hidden = false;
}

const CODE_RE = /^\d{6}$/;

function enterCodeStep() {
  $("sent-box").hidden = false;
  $("code-field").hidden = false;
  const btn = $("login-btn");
  btn.textContent = "Verify code";
  const emailInput = $("login-email");
  emailInput.disabled = true;
  emailInput.style.opacity = ".7";
  $("login-name").disabled = true;
  $("login-phone").disabled = true;
  $("login-name").style.opacity = ".7";
  $("login-phone").style.opacity = ".7";
  setTimeout(() => $("login-code").focus(), 60);
}

async function sendCode() {
  $("login-error").hidden = true;
  $("login-hint").hidden = true;
  $("sent-box").hidden = true;

  const name = $("login-name").value.trim();
  const phone = $("login-phone").value.trim();
  const email = $("login-email").value.trim();

  if (!email) {
    showLoginError("Enter your email address.");
    return;
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showLoginError("That email address doesn't look right.");
    return;
  }

  if (!supabaseClient) {
    showLoginError("Sign-in is unavailable right now. Please try again later.");
    return;
  }

  const btn = $("login-btn");
  btn.disabled = true;
  btn.textContent = "Sending code…";

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Saved on the account when it's created (reused at checkout)
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {})
      }
    }
  });

  btn.disabled = false;

  if (error) {
    btn.textContent = "Send security code";
    console.warn("OTP error:", error.message);
    const msg = String(error.message).toLowerCase();
    if (msg.includes("rate limit") || msg.includes("too many")) {
      showLoginHint(
        "We just sent you a code. Wait a minute before requesting another — they're rate-limited to keep things safe."
      );
    } else if (msg.includes("provider email is not enabled")) {
      showLoginHint(
        "Email sign-in isn't switched on yet. Enable it in <strong>Supabase → Authentication → Providers → Email</strong>."
      );
    } else {
      showLoginError(error.message);
    }
    return;
  }

  pendingEmail = email;
  $("sent-email").textContent = email;
  btn.textContent = "Verify code";
  enterCodeStep();
}

async function verifyCode() {
  const code = $("login-code").value.trim();

  if (!CODE_RE.test(code)) {
    showLoginError("Enter the 6-digit code from your email.");
    return;
  }

  if (!pendingEmail) {
    showLoginError("We don't have your email yet. Send the code again.");
    return;
  }

  if (!supabaseClient) {
    showLoginError("Sign-in is unavailable right now. Please try again later.");
    return;
  }

  const btn = $("login-btn");
  btn.disabled = true;
  btn.textContent = "Verifying…";

  const { data, error } = await supabaseClient.auth.verifyOtp({
    email: pendingEmail,
    token: code,
    type: "email"
  });

  btn.disabled = false;

  if (error) {
    btn.textContent = "Verify code";
    console.warn("verifyOtp error:", error.message);
    const msg = String(error.message).toLowerCase();
    if (msg.includes("expire")) {
      showLoginError("That code expired. Send a new one and try again.");
    } else if (msg.includes("rate limit") || msg.includes("too many")) {
      showLoginError("Too many attempts. Wait a minute and try again.");
    } else {
      showLoginError("That code didn't match. Check it and re-enter it, or request a new code.");
    }
    $("login-code").value = "";
    $("login-code").focus();
    return;
  }

  if (data && data.session) {
    window.location.href = nextUrl();
  } else {
    showLoginError("We couldn't verify that code. Send a new one and try again.");
  }
}

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const btn = $("login-btn");
  if (btn.textContent === "Verify code") {
    await verifyCode();
  } else {
    await sendCode();
  }
});

$("login-code").addEventListener("input", () => {
  const code = $("login-code");
  code.value = code.value.replace(/\D/g, "").slice(0, 6);
  if (code.value.length === 6) {
    verifyCode();
  }
});

// ------------------------------------------------------------
// Boot: if the user is already signed in, send them on their way.
// ------------------------------------------------------------
async function init() {
  if (!supabaseClient) return;

  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      window.location.href = nextUrl();
    }
  } catch (error) {
    console.warn("getSession failed:", error);
  }
}

init();