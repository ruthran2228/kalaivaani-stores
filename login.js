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
    supabaseClient = ksSupabaseClient();
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

async function seedProfile(name, phone, email) {
  try {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.auth.getUser();
    const user = data && data.user;
    if (!user) return;

    const existing = await supabaseClient
      .from("profiles")
      .select("user_id, addresses")
      .eq("user_id", user.id)
      .maybeSingle();

    // Keep any addresses already saved; only refresh the contact details.
    const addresses =
      existing.data && Array.isArray(existing.data.addresses)
        ? existing.data.addresses
        : [];

    await supabaseClient.from("profiles").upsert(
      {
        user_id: user.id,
        name: name || (user.user_metadata && user.user_metadata.name) || "",
        phone: phone || (user.user_metadata && user.user_metadata.phone) || "",
        email: email || user.email || "",
        addresses,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );
  } catch (error) {
    console.warn("Profile seed skipped:", error.message);
  }
}

let verifying = false;

async function verifyCode() {
  if (verifying) return;

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

  verifying = true;
  const btn = $("login-btn");
  btn.disabled = true;
  btn.textContent = "Verifying…";

  try {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: "email"
    });

    if (error) {
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
      // Save the session before navigating away, so the next page sees the
      // user as signed in instead of bouncing back to this page.
      try {
        await supabaseClient.auth.setSession(data.session);
      } catch (setError) {
        console.warn("setSession failed:", setError);
      }

      // Confirm the session actually saved. Give slow phones a moment —
      // a wrong "blocked storage" message here is worse than no message.
      let saved = false;
      try {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        for (let i = 0; i < 5 && !saved; i++) {
          const check = await supabaseClient.auth.getSession();
          saved = !!(check && check.data && check.data.session);
          if (!saved && i < 4) await wait(300);
        }
      } catch (checkError) {
        console.warn("session read-back failed:", checkError);
      }

      if (!saved) {
        showLoginError(
          "Looks like this browser is blocking saved sign-ins (private/incognito mode). Please open the site in a normal tab to sign in."
        );
        return;
      }

      const name = $("login-name").value.trim();
      const phone = $("login-phone").value.trim();

      // Keep account metadata current so your name and phone always carry
      // through to checkout — even for accounts made before they were asked.
      try {
        const patch = {};
        if (name) patch.name = name;
        if (phone) patch.phone = phone;
        if (Object.keys(patch).length) {
          await supabaseClient.auth.updateUser({ data: patch });
        }
      } catch (updateError) {
        console.warn("updateUser skipped:", updateError.message);
      }

      await seedProfile(name, phone, pendingEmail);
      window.location.href = nextUrl();
    } else {
      showLoginError("We couldn't verify that code. Send a new one and try again.");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Verify code";
    verifying = false;
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