/**
 * profile.js — The Curated Crate
 * Profile page: user info, order history, subscription, preferences, account
 */

const PREF_KEY = "tcc_prefs";
const SUB_KEY  = "tcc_subscription";

const CRAFT_CATEGORIES = [
  { id: "textiles",   icon: "🧵", label: "Textiles" },
  { id: "pottery",    icon: "🏺", label: "Pottery" },
  { id: "sculptures", icon: "🗿", label: "Sculptures" },
  { id: "art",        icon: "🎨", label: "Art" },
  { id: "home",       icon: "🏡", label: "Home Décor" },
  { id: "apparel",    icon: "👘", label: "Apparel" },
  { id: "gifts",      icon: "🎁", label: "Gifts" },
  { id: "jewelry",    icon: "💍", label: "Jewelry" }
];

const REGIONS = [
  { id: "rajasthan",   icon: "🏜️", label: "Rajasthan" },
  { id: "kashmir",     icon: "🏔️", label: "Kashmir" },
  { id: "odisha",      icon: "🎏", label: "Odisha" },
  { id: "bengal",      icon: "🪷", label: "Bengal" },
  { id: "gujarat",     icon: "🕌", label: "Gujarat" },
  { id: "karnataka",   icon: "🌴", label: "Karnataka" },
  { id: "bihar",       icon: "🌾", label: "Bihar" },
  { id: "maharashtra", icon: "🎭", label: "Maharashtra" }
];

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireAuth();
  renderNavbar("profile");
  setupNavbarScroll();

  loadUserProfile();
  initPreferences();
  renderSubscriptionStatus();

  // Default to orders tab
  switchTab("orders", document.querySelector(".profile-tab.active"));
});

function setupNavbarScroll() {
  const nav = document.getElementById("tcc-navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}

// ─── User Profile ─────────────────────────────────────────────
function loadUserProfile() {
  const user = Auth.getCurrentUser();
  if (!user) return;

  document.getElementById("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;

  const joinedDate = new Date(user.joinedAt);
  document.getElementById("memberSince").textContent = joinedDate.toLocaleDateString("en-IN", {
    month: "long", year: "numeric"
  });

  // Account tab fields
  document.getElementById("accName").value = user.name || "";
  document.getElementById("accEmail").value = user.email || "";
  document.getElementById("accPhone").value = user.phone || "";

  // Quick stats
  const orders = Orders.get();
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const artisansSupported = [...new Set(orders.flatMap(o =>
    (o.items || []).map(i => getProductById(i.productId)?.artisan?.name).filter(Boolean)
  ))].length;

  document.getElementById("profileQuickStats").innerHTML = `
    <div class="pqs-item">
      <span class="pqs-num">${orders.length}</span>
      <span class="pqs-label">Orders</span>
    </div>
    <div class="pqs-item">
      <span class="pqs-num">${artisansSupported}</span>
      <span class="pqs-label">Artisans Backed</span>
    </div>
    <div class="pqs-item">
      <span class="pqs-num">${formatINR(totalSpent)}</span>
      <span class="pqs-label">Total Spent</span>
    </div>
  `;
}

// ─── Tab Switching ────────────────────────────────────────────
window.switchTab = function(tabName, btn) {
  // Deactivate all tabs and panels
  document.querySelectorAll(".profile-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));

  // Activate selected
  if (btn) btn.classList.add("active");

  const panelMap = {
    orders:       "tabOrders",
    subscription: "tabSubscription",
    preferences:  "tabPreferences",
    account:      "tabAccount"
  };

  document.getElementById(panelMap[tabName])?.classList.remove("hidden");

  if (tabName === "orders") renderOrders();
  if (tabName === "subscription") renderSubscriptionStatus();
};

// ─── Orders ──────────────────────────────────────────────────
function renderOrders() {
  const orders = Orders.get();
  const list = document.getElementById("ordersList");

  if (orders.length === 0) {
    list.innerHTML = `
      <div class="empty-orders">
        <div class="empty-state-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your first artisan purchase is just a click away.</p>
        <a href="product.html" class="btn btn-primary" style="margin-top:16px">Shop Now</a>
      </div>
    `;
    document.getElementById("ordersFilterBtns").innerHTML = "";
    return;
  }

  // Filter buttons
  document.getElementById("ordersFilterBtns").innerHTML = `
    <button class="tag active" onclick="filterOrders('all', this)">All</button>
    <button class="tag" onclick="filterOrders('Confirmed', this)">Confirmed</button>
    <button class="tag" onclick="filterOrders('Shipped', this)">Shipped</button>
    <button class="tag" onclick="filterOrders('Delivered', this)">Delivered</button>
  `;

  renderOrderCards(orders);
}

window.filterOrders = function(status, btn) {
  document.querySelectorAll(".orders-filter .tag").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  const orders = Orders.get();
  const filtered = status === "all" ? orders : orders.filter(o => o.status === status);
  renderOrderCards(filtered);
};

function renderOrderCards(orders) {
  const list = document.getElementById("ordersList");

  if (orders.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--clr-text-muted)">
        No orders found for this filter.
      </div>
    `;
    return;
  }

  list.innerHTML = orders.map(order => {
    const date = new Date(order.placedAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });

    const statusClass = {
      "Confirmed": "status-confirmed",
      "Shipped": "status-shipped",
      "Delivered": "status-delivered"
    }[order.status] || "status-confirmed";

    // First 4 items as thumbnails
    const thumbs = (order.items || []).slice(0, 4).map(item => {
      const p = getProductById(item.productId);
      return p ? `
        <div class="order-item-thumb">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
      ` : "";
    }).join("");

    const extraItems = Math.max(0, (order.items || []).length - 4);

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <span class="order-id">${order.id}</span>
            <span class="order-date" style="margin-left:12px">${date}</span>
          </div>
          <span class="order-status ${statusClass}">● ${order.status}</span>
        </div>
        <div class="order-card-body">
          <div class="order-items-preview">
            ${thumbs}
            ${extraItems > 0 ? `<div class="order-item-thumb"><div class="order-item-count">+${extraItems}</div></div>` : ""}
          </div>
          <div style="font-size:0.82rem;color:var(--clr-text-muted)">
            ${(order.items || []).map(i => {
              const p = getProductById(i.productId);
              return p ? `${p.name} ×${i.qty}` : "";
            }).filter(Boolean).join("  ·  ")}
          </div>
        </div>
        <div class="order-card-footer">
          <div>
            <p class="order-total">${formatINR(order.total)}</p>
            <p class="order-payment">${order.payment || "UPI"}</p>
          </div>
          <div class="order-artisan-impact">
            <span>💚</span> Supported ${order.artisanCount || 1} artisan${(order.artisanCount || 1) !== 1 ? 's' : ''}
          </div>
          <div style="text-align:right">
            <p style="font-size:0.75rem;color:var(--clr-text-muted)">📍 ${order.address?.city || "India"}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ─── Subscription ─────────────────────────────────────────────
function renderSubscriptionStatus() {
  const sub = JSON.parse(localStorage.getItem(SUB_KEY) || "null");
  const card = document.getElementById("subStatusCard");
  if (!card) return;

  if (sub) {
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:1.5rem">✅</span>
        <div>
          <strong style="font-size:0.9rem;color:var(--clr-walnut)">Active: ${sub.plan} Plan</strong>
          <p style="font-size:0.78rem;color:var(--clr-text-muted)">Next box ships ${sub.nextDate}</p>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="cancelSubscription()" style="font-size:0.75rem">Cancel Subscription</button>
    `;
  } else {
    card.innerHTML = `
      <div style="text-align:center">
        <p style="font-size:0.88rem;color:var(--clr-text-muted);margin-bottom:12px">You don't have an active subscription</p>
        <p style="font-size:0.78rem;color:var(--clr-text-muted)">Subscribe below to receive monthly curated artisan boxes.</p>
      </div>
    `;
  }
}

window.subscribePlan = function(plan) {
  const planLabels = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 30);

  const sub = {
    plan: planLabels[plan],
    startedAt: new Date().toISOString(),
    nextDate: nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  };

  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  renderSubscriptionStatus();
  Toast.show(`🎁 Subscribed to ${planLabels[plan]} Crate! Your first box ships in 30 days.`, "success", 4000);
};

window.cancelSubscription = function() {
  if (confirm("Cancel your Curated Crate subscription?")) {
    localStorage.removeItem(SUB_KEY);
    renderSubscriptionStatus();
    Toast.show("Subscription cancelled. We'll miss you!", "info");
  }
};

// ─── Preferences ─────────────────────────────────────────────
function initPreferences() {
  const saved = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");

  // Categories chips
  const catContainer = document.getElementById("prefCategories");
  if (catContainer) {
    catContainer.innerHTML = CRAFT_CATEGORIES.map(c => `
      <div class="pref-chip ${(saved.categories || []).includes(c.id) ? 'selected' : ''}"
           onclick="toggleChip(this, '${c.id}', 'categories')" data-id="${c.id}">
        <span>${c.icon}</span> ${c.label}
      </div>
    `).join("");
  }

  // Regions chips
  const regContainer = document.getElementById("prefRegions");
  if (regContainer) {
    regContainer.innerHTML = REGIONS.map(r => `
      <div class="pref-chip ${(saved.regions || []).includes(r.id) ? 'selected' : ''}"
           onclick="toggleChip(this, '${r.id}', 'regions')" data-id="${r.id}">
        <span>${r.icon}</span> ${r.label}
      </div>
    `).join("");
  }

  // Price range
  const priceVal = saved.priceRange || "mid";
  const priceRadio = document.querySelector(`input[name="priceRange"][value="${priceVal}"]`);
  if (priceRadio) priceRadio.checked = true;

  // Notification toggles
  if (saved.notifNew !== undefined) document.getElementById("notifNew").checked = saved.notifNew;
  if (saved.notifOffers !== undefined) document.getElementById("notifOffers").checked = saved.notifOffers;
  if (saved.notifStories !== undefined) document.getElementById("notifStories").checked = saved.notifStories;
}

window.toggleChip = function(el, id, group) {
  el.classList.toggle("selected");
};

window.savePreferences = function() {
  const categories = [...document.querySelectorAll("#prefCategories .pref-chip.selected")]
    .map(c => c.dataset.id);
  const regions = [...document.querySelectorAll("#prefRegions .pref-chip.selected")]
    .map(c => c.dataset.id);
  const priceRange = document.querySelector('input[name="priceRange"]:checked')?.value || "mid";
  const notifNew = document.getElementById("notifNew")?.checked;
  const notifOffers = document.getElementById("notifOffers")?.checked;
  const notifStories = document.getElementById("notifStories")?.checked;

  localStorage.setItem(PREF_KEY, JSON.stringify({ categories, regions, priceRange, notifNew, notifOffers, notifStories }));
  Toast.show("✓ Preferences saved!", "success");
};

// ─── Account ──────────────────────────────────────────────────
window.saveAccount = function() {
  const email = localStorage.getItem(KEYS.TOKEN);
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "{}");
  const user = users[email];
  if (!user) return;

  const newName = document.getElementById("accName").value.trim();
  const newPhone = document.getElementById("accPhone").value.trim();

  if (!newName || newName.length < 2) {
    Toast.show("Please enter a valid name.", "error");
    return;
  }

  user.name = newName;
  user.phone = newPhone;
  users[email] = user;
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));

  // Update header
  document.getElementById("profileAvatar").textContent = newName.charAt(0).toUpperCase();
  document.getElementById("profileName").textContent = newName;

  Toast.show("✓ Account updated successfully!", "success");
};

window.deleteAccount = function() {
  const confirmed = confirm("Are you absolutely sure? This action cannot be undone. All your data, orders, and preferences will be permanently deleted.");
  if (confirmed) {
    const email = localStorage.getItem(KEYS.TOKEN);
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "{}");
    delete users[email];
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    [KEYS.TOKEN, KEYS.CART, KEYS.ORDERS, PREF_KEY, SUB_KEY].forEach(k => localStorage.removeItem(k));
    Toast.show("Account deleted. We're sorry to see you go.", "info");
    setTimeout(() => window.location.href = "login.html", 1500);
  }
};
