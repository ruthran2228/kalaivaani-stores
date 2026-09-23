// ============================================================
// Kalaivani Stores — Login page (email OTP / magic link)
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

function absoluteSiteUrl() {
  return new URL("index.html", window.location.href).href;
}

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

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  $("login-error").hidden = true;
  $("login-hint").hidden = true;
  $("sent-box").hidden = true;

  const email = $("login-email").value.trim();

  if (!email) {
    showLoginError("Enter your email address.");
    return;
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showLoginError("That email address doesn't look right.");
    return;
  }

  const btn = $("login-btn");
  btn.disabled = true;
  btn.textContent = "Sending link…";

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: absoluteSiteUrl(),
      shouldCreateUser: true
    }
  });

  btn.disabled = false;
  btn.textContent = "Send sign-in link";

  if (error) {
    console.warn("OTP error:", error.message);
    const msg = String(error.message).toLowerCase();
    if (msg.includes("rate limit") || msg.includes("too many")) {
      showLoginHint(
        "We just sent you a link. Wait a minute before requesting another, they're rate-limited to keep things safe."
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

  $("sent-email").textContent = email;
  $("sent-box").hidden = false;
});

// ------------------------------------------------------------
// Boot: if a magic-link code is present (returning from email),
// supabase-js exchanges it automatically when getSession runs.
// If the user is already signed in, send them on their way.
// ------------------------------------------------------------
async function init() {
  if (!supabaseClient) {
    showLoginError("Sign-in is unavailable right now. Please try again later.");
    return;
  }

  try {
    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
      window.location.href = nextUrl();
      return;
    }
  } catch (error) {
    console.warn("getSession failed:", error);
  }
}

init();