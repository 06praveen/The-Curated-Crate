/**
 * shared.js — The Curated Crate
 * Shared utilities: auth, cart, localStorage helpers, toast notifications
 */

const KEYS = {
  TOKEN:  "tcc_token",
  USER:   "tcc_user",
  CART:   "tcc_cart"
};

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem(KEYS.TOKEN);
  const headers = { ...options.headers, "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && token) Auth.logout();
  return res;
};

const Auth = {
  isLoggedIn() { return !!localStorage.getItem(KEYS.TOKEN); },
  getCurrentUser() { return JSON.parse(localStorage.getItem(KEYS.USER) || "null"); },
  async login(email, password) {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST", body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(KEYS.TOKEN, data.token);
        localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
        Cart.sync();
        return { success: true, user: data.user };
      }
      return { success: false, message: await res.text() || "Login failed" };
    } catch(e) { return { success: false, message: "Network error" }; }
  },
  async signup(name, email, password, phone) {
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST", body: JSON.stringify({ name, email, password, phone })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(KEYS.TOKEN, data.token);
        localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
        return { success: true, ...data };
      }
      return { success: false, message: await res.text() || "Signup failed" };
    } catch(e) { return { success: false, message: "Network error" }; }
  },
  logout() {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.CART);
    window.location.href = "login.html";
  },
  requireAuth() {
    if (!this.isLoggedIn()) { window.location.href = "login.html"; return false; }
    return true;
  }
};

const Cart = {
  get() { return JSON.parse(localStorage.getItem(KEYS.CART) || "[]"); },
  saveLocal(arr) {
    const internalCart = arr.map(i => ({ productId: i.product?.id || i.product, qty: i.quantity }));
    localStorage.setItem(KEYS.CART, JSON.stringify(internalCart));
    Cart.updateBadge();
  },
  async sync() {
    if (!Auth.isLoggedIn()) return;
    try {
      const res = await apiFetch("/api/cart");
      if (res.ok) this.saveLocal(await res.json());
    } catch(e) {}
  },
  async add(productId, qty = 1) {
    if(!Auth.isLoggedIn()) { window.location.href = "login.html"; return; }
    try {
      const res = await apiFetch("/api/cart", {
        method: "POST", body: JSON.stringify({ productId, qty })
      });
      if (res.ok) {
        this.saveLocal(await res.json());
        Toast.show("✨ Added to your crate!", "success");
      }
    } catch(e) {}
  },
  async remove(productId) {
    if(!Auth.isLoggedIn()) return;
    try {
      const res = await apiFetch(`/api/cart/${productId}`, { method: "DELETE" });
      if (res.ok) await this.sync();
    } catch(e) {}
  },
  async updateQty(productId, qty) {
    if(!Auth.isLoggedIn()) return;
    try {
      const res = await apiFetch(`/api/cart/${productId}`, {
        method: "PATCH", body: JSON.stringify({ qty })
      });
      if (res.ok) this.saveLocal(await res.json());
    } catch(e) {}
  },
  async clear() {
    if(!Auth.isLoggedIn()) return;
    try {
      const res = await apiFetch("/api/cart", { method: "DELETE" });
      if (res.ok) this.saveLocal([]);
    } catch(e) {}
  },
  count() { return this.get().reduce((sum, i) => sum + i.qty, 0); },
  total() {
    return this.get().reduce((sum, item) => {
      const product = window.getProductById ? window.getProductById(item.productId) : null;
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  },
  updateBadge() {
    const badge = document.querySelector(".cart-badge");
    if (badge) {
      const count = Cart.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }
};

const Orders = {
  async place(orderData) {
    if(!Auth.isLoggedIn()) return;
    try {
      const res = await apiFetch("/api/orders/checkout", {
        method: "POST", body: JSON.stringify(orderData)
      });
      if (res.ok) {
        Cart.saveLocal([]);
        return await res.json();
      }
    } catch(e) {}
    return null;
  }
};

// ─── Toast Notification ───────────────────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (document.getElementById("tcc-toast-container")) return;
    const c = document.createElement("div");
    c.id = "tcc-toast-container";
    c.style.cssText = `
      position:fixed; bottom:28px; right:28px; z-index:9999;
      display:flex; flex-direction:column; gap:12px; pointer-events:none;
    `;
    document.body.appendChild(c);
    Toast.container = c;
  },
  show(message, type = "info", duration = 3200) {
    Toast.init();
    const toast = document.createElement("div");
    const colors = {
      success: "linear-gradient(135deg,#c17c3a,#d4a48a)",
      error:   "linear-gradient(135deg,#c0392b,#e74c3c)",
      info:    "linear-gradient(135deg,#2c1810,#5a3a28)"
    };
    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      color: #f8f3ec;
      padding: 14px 22px;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.3px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      pointer-events: auto;
      transform: translateX(120px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
      max-width: 320px;
      cursor: pointer;
    `;
    toast.textContent = message;
    Toast.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    const dismiss = () => {
      toast.style.transform = "translateX(120px)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 400);
    };
    toast.addEventListener("click", dismiss);
    setTimeout(dismiss, duration);
  }
};

// ─── Navbar Renderer ─────────────────────────────────────────────────────────
function renderNavbar(activePage = "home") {
  const user = Auth.getCurrentUser();
  const cartCount = Cart.count();

  const nav = document.getElementById("tcc-navbar");
  if (!nav) return;

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="home.html" class="nav-logo">
        <span class="logo-mark">◈</span>
        <span>The Curated Crate</span>
      </a>
      <div class="nav-links">
        <a href="home.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="product.html" class="${activePage === 'products' ? 'active' : ''}">Discover</a>
        <a href="product.html?category=textiles" class="${activePage === 'textiles' ? 'active' : ''}">Textiles</a>
        <a href="product.html?category=pottery" class="${activePage === 'pottery' ? 'active' : ''}">Pottery</a>
      </div>
      <div class="nav-actions">
        <button class="nav-search-btn" onclick="toggleNavSearch()" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <a href="cart.html" class="nav-cart" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <span class="cart-badge" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
        </a>
        ${user
          ? `<a href="profile.html" class="nav-avatar" title="${user.name}">
               ${user.name.charAt(0).toUpperCase()}
             </a>`
          : `<a href="login.html" class="nav-cta">Sign In</a>`
        }
        <button class="nav-hamburger" onclick="toggleMobileMenu()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
    <div class="nav-search-bar" id="navSearchBar">
      <input type="text" placeholder="Search artisans, crafts, regions…" id="navSearchInput" onkeydown="handleNavSearch(event)">
      <button onclick="executeNavSearch()">Search</button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="home.html">Home</a>
      <a href="product.html">Discover</a>
      <a href="cart.html">Cart</a>
      <a href="${user ? 'profile.html' : 'login.html'}">${user ? 'Profile' : 'Sign In'}</a>
    </div>
  `;

  Cart.updateBadge();
}

function toggleNavSearch() {
  const bar = document.getElementById("navSearchBar");
  if (!bar) return;
  bar.classList.toggle("open");
  if (bar.classList.contains("open")) {
    setTimeout(() => document.getElementById("navSearchInput")?.focus(), 150);
  }
}

function handleNavSearch(e) {
  if (e.key === "Enter") executeNavSearch();
}

function executeNavSearch() {
  const val = document.getElementById("navSearchInput")?.value?.trim();
  if (val) window.location.href = `product.html?search=${encodeURIComponent(val)}`;
}

function toggleMobileMenu() {
  document.getElementById("mobileMenu")?.classList.toggle("open");
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

// ─── Currency Formatter ───────────────────────────────────────────────────────
function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
}

// ─── Stars Renderer ───────────────────────────────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = "";
  for (let i = 0; i < full; i++) html += `<span class="star full">★</span>`;
  if (half) html += `<span class="star half">½</span>`;
  for (let i = full + (half ? 1 : 0); i < 5; i++) html += `<span class="star empty">☆</span>`;
  return html;
}

// Init on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  Toast.init();
  initScrollReveal();
});
