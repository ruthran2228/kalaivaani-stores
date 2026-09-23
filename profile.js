// ------------------------------------------------------------
// Kalaivani Stores — profile data helpers + profile page logic
// Profile data lives in the "profiles" table (see profile_setup.sql).
// Name/phone/email fall back to the account metadata saved at sign-up.
// ------------------------------------------------------------

function makeAddressId() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
}

function emptyAddress() {
  return {
    id: makeAddressId(),
    label: "Home",
    house: "",
    area: "",
    landmark: "",
    city: "",
    pincode: ""
  };
}

function fmtAddress(addr) {
  if (!addr) return "";
  return [
    addr.house,
    addr.area,
    addr.landmark,
    addr.city,
    addr.pincode
  ]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(", ");
}

async function getProfile() {
  if (!supabaseClient) return null;
  try {
    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData && userData.user;
    if (!user) return null;

    const meta = user.user_metadata || {};
    const base = {
      name: meta.name || "",
      phone: meta.phone || "",
      email: user.email || meta.email || "",
      addresses: []
    };

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("name, phone, email, addresses")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("getProfile read failed:", error.message);
      return base;
    }
    if (!data) return base;

    return {
      name: data.name || base.name,
      phone: data.phone || base.phone,
      email: data.email || base.email,
      addresses: Array.isArray(data.addresses) ? data.addresses : []
    };
  } catch (error) {
    console.warn("getProfile failed:", error);
    return null;
  }
}

async function saveProfile(profile) {
  if (!supabaseClient) return { error: { message: "Connection unavailable" } };
  try {
    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData && userData.user;
    if (!user) return { error: { message: "Not signed in" } };

    return await supabaseClient.from("profiles").upsert(
      {
        user_id: user.id,
        name: (profile.name || "").trim(),
        phone: (profile.phone || "").trim(),
        email: (profile.email || "").trim(),
        addresses: Array.isArray(profile.addresses) ? profile.addresses : [],
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );
  } catch (error) {
    console.warn("saveProfile failed:", error);
    return { error };
  }
}

// ------------------------------------------------------------
// Profile page
// ------------------------------------------------------------
(function initProfilePage() {
  if (!document.getElementById("profile-app")) return;

  const $ = (id) => document.getElementById(id);

  let profile = { name: "", phone: "", email: "", addresses: [] };
  let dirty = false;

  function redirectToLogin() {
    const url = new URL("login.html", window.location.href);
    url.searchParams.set("next", window.location.pathname + window.location.search);
    window.location.replace(url.toString());
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function addrLabelChips(addr) {
    const options = ["Home", "Office", "Other"];
    return options
      .map(
        (l) =>
          `<button type="button" class="addr-label-chip${addr.label === l ? " active" : ""}" data-label="${l}">${l}</button>`
      )
      .join("");
  }

  function addressCard(addr, index) {
    return `
      <div class="addr-card" data-addr-index="${index}">
        <div class="addr-card-head">
          <div class="addr-label-chip-group">${addrLabelChips(addr)}</div>
          <button type="button" class="addr-remove" data-addr-remove="${index}" aria-label="Delete this address">×</button>
        </div>
        <div class="addr-grid">
          <label class="addr-wide">House / room no.
            <input data-addr-field="house" value="${esc(addr.house)}" placeholder="Hostel, room no., flat…" autocomplete="address-line1">
          </label>
          <label>Area / street
            <input data-addr-field="area" value="${esc(addr.area)}" placeholder="Street, area…" autocomplete="address-line2">
          </label>
          <label>Landmark
            <input data-addr-field="landmark" value="${esc(addr.landmark)}" placeholder="Near…" autocomplete="address-line3">
          </label>
          <label>City
            <input data-addr-field="city" value="${esc(addr.city)}" placeholder="City" autocomplete="address-level2">
          </label>
          <label>Pincode
            <input data-addr-field="pincode" value="${esc(addr.pincode)}" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]*" maxlength="6" placeholder="6 digits">
          </label>
        </div>
      </div>`;
  }

  function renderAddresses() {
    const box = $("addr-list");
    if (!profile.addresses.length) {
      box.innerHTML =
        '<div class="addr-empty">No saved addresses yet — add one below and it will be saved to your profile.</div>';
      return;
    }
    box.innerHTML = profile.addresses.map(addressCard).join("");
  }

  function collectAddresses() {
    const cards = document.querySelectorAll("[data-addr-index]");
    return Array.from(cards).map((card) => {
      const index = Number(card.dataset.addrIndex);
      const addr = profile.addresses[index] || emptyAddress();
      card.querySelectorAll("[data-addr-field]").forEach((input) => {
        addr[input.dataset.addrField] = input.value.trim();
      });
      const chip = card.querySelector(".addr-label-chip.active");
      if (chip) addr.label = chip.dataset.label;
      return addr;
    });
  }

  $("addr-list").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-addr-remove]");
    if (remove) {
      const index = Number(remove.dataset.addrRemove);
      profile.addresses.splice(index, 1);
      dirtyFlag();
      renderAddresses();
      return;
    }
    const chip = event.target.closest(".addr-label-chip");
    if (chip) {
      const card = chip.closest(".addr-card");
      card.querySelectorAll(".addr-label-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      dirtyFlag();
    }
  });

  $("addr-list").addEventListener("input", (event) => {
    if (event.target.closest("[data-addr-field]")) dirtyFlag();
  });

  $("add-addr-btn").addEventListener("click", () => {
    profile.addresses.push(emptyAddress());
    renderAddresses();
    dirtyFlag();
    const last = document.querySelector(".addr-card:last-of-type");
    if (last) last.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function dirtyFlag() {
    dirty = true;
    $("save-btn").disabled = false;
  }

  function setSaving(next) {
    const btn = $("save-btn");
    btn.disabled = next;
    btn.textContent = next ? "Saving…" : "Save changes";
  }

  function nextUrl() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next || "./index.html";
  }

  $("save-btn").addEventListener("click", async () => {
    const name = ($("pf-name").value || "").trim();
    const phone = ($("pf-phone").value || "").trim();

    if (!name) {
      showToast("Please enter your name.");
      $("pf-name").focus();
      return;
    }

    profile.addresses = collectAddresses();
    profile.name = name;
    profile.phone = phone;

    setSaving(true);
    const { error } = await saveProfile(profile);
    setSaving(false);

    if (error) {
      if (String(error.message || "").includes("Execute") ||
          String(error.message || "").includes("does not exist") ||
          error.code === "42P01") {
        showToast("Profile save failed — please run profile_setup.sql in Supabase first.");
      } else {
        showToast("Could not save. Please try again.");
      }
      dirtyFlag();
      return;
    }

    dirty = false;
    showToast("Profile saved");
    window.setTimeout(() => {
      window.location.href = nextUrl();
    }, 700);
  });

  $("logout-btn").addEventListener("click", async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.replace("login.html");
  });

  $("next-url").href = nextUrl();

  async function start() {
    if (!supabaseClient) {
      redirectToLogin();
      return;
    }
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (!data || !data.session) {
        redirectToLogin();
        return;
      }
    } catch (error) {
      redirectToLogin();
      return;
    }

    const loaded = await getProfile();
    if (loaded) profile = loaded;
    const lo = $("logout-btn");
    if (lo) lo.hidden = false;
    $("pf-email").value = profile.email || "";
    $("pf-email").setAttribute("placeholder", profile.email || "");
    $("pf-name").value = profile.name || "";
    $("pf-phone").value = profile.phone || "";
    renderAddresses();

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