/**
 * cart.js — The Curated Crate
 * Cart page: render items, quantity controls, promo code, summary
 */

let promoApplied = false;
const PROMO_CODES = {
  "CRATE10": { discount: 10, label: "10% off applied" },
  "ARTISAN": { discount: 15, label: "15% artisan supporter discount!" },
  "WELCOME": { discount: 12, label: "12% welcome discount applied" }
};

document.addEventListener("DOMContentLoaded", async () => {
  await window.initProducts();
  renderNavbar("cart");
  setupNavbarScroll();
  renderCart();
});

function setupNavbarScroll() {
  const nav = document.getElementById("tcc-navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}

function renderCart() {
  const cart = Cart.get();
  const emptySection = document.getElementById("emptyCart");
  const cartLayout = document.getElementById("cartLayout");

  if (cart.length === 0) {
    emptySection.style.display = "block";
    cartLayout.style.display = "none";
    renderEmptySuggestions();
    return;
  }

  emptySection.style.display = "none";
  cartLayout.style.display = "grid";

  renderCartItems(cart);
  renderSummary(cart);
}

// ─── Cart Items ───────────────────────────────────────────────
function renderCartItems(cart) {
  const list = document.getElementById("cartItemsList");
  if (!list) return;

  list.innerHTML = cart.map(item => {
    const p = getProductById(item.productId);
    if (!p) return "";
    return `
      <div class="cart-item" id="cartItem${p.id}">
        <div class="cart-item-img" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <p class="cart-item-category">${p.category}</p>
          <h3 class="cart-item-name">${p.name}</h3>
          <p class="cart-item-artisan">By ${p.artisan.name} · ${p.artisan.village}</p>
          <p class="cart-item-price">${formatINR(p.price)}</p>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" onclick="changeQty(${p.id}, -1)" aria-label="Decrease">−</button>
            <span class="cart-qty-num" id="qty${p.id}">${item.qty}</span>
            <button class="cart-qty-btn" onclick="changeQty(${p.id}, 1)" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <button class="cart-remove-btn" onclick="removeItem(${p.id})" aria-label="Remove ${p.name}">✕</button>
          <div>
            <p class="cart-item-subtotal-label">Subtotal</p>
            <p class="cart-item-subtotal" id="subtotal${p.id}">${formatINR(p.price * item.qty)}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ─── Summary ──────────────────────────────────────────────────
function renderSummary(cart) {
  const subtotal = Cart.total();
  const shipping = subtotal >= 1500 ? 0 : 99;
  const promoCode = document.getElementById("promoInput")?.value?.trim().toUpperCase();
  const promo = promoApplied && PROMO_CODES[promoCode] ? PROMO_CODES[promoCode] : null;
  const discountAmt = promo ? Math.round(subtotal * promo.discount / 100) : 0;
  const total = subtotal + shipping - discountAmt;

  const savings = TCC_PRODUCTS.reduce((sum, p) => {
    const item = cart.find(c => c.productId === p.id);
    return sum + (item ? (p.originalPrice - p.price) * item.qty : 0);
  }, 0);

  const totalArtisans = [...new Set(cart.map(c => getProductById(c.productId)?.artisan?.name).filter(Boolean))].length;

  document.getElementById("summaryLines").innerHTML = `
    <div class="summary-line">
      <span class="key">Subtotal (${Cart.count()} items)</span>
      <span class="val">${formatINR(subtotal)}</span>
    </div>
    <div class="summary-line">
      <span class="key">Shipping</span>
      <span class="val ${shipping === 0 ? 'green' : ''}">${shipping === 0 ? 'FREE' : formatINR(shipping)}</span>
    </div>
    ${savings > 0 ? `
    <div class="summary-line">
      <span class="key">You're saving</span>
      <span class="val green">−${formatINR(savings)}</span>
    </div>` : ''}
    ${discountAmt > 0 ? `
    <div class="summary-line">
      <span class="key">Promo (${promoCode})</span>
      <span class="val green">−${formatINR(discountAmt)}</span>
    </div>` : ''}
    ${shipping > 0 ? `
    <div class="summary-line" style="font-size:0.75rem">
      <span class="key" style="color:var(--clr-sage)">Add ${formatINR(1500 - subtotal)} more for FREE shipping</span>
    </div>` : ''}
  `;

  document.getElementById("cartGrandTotal").textContent = formatINR(total);

  // Artisan impact note
  document.getElementById("cartImpactNote").innerHTML = `
    <span>💚</span>
    This order supports ${totalArtisans} artisan${totalArtisans !== 1 ? 's' : ''} directly
  `;

  // Store calculated total for checkout
  sessionStorage.setItem("tcc_cart_total", total);
}

// ─── Quantity Change ──────────────────────────────────────────
window.changeQty = function(productId, delta) {
  const cart = Cart.get();
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty < 1) {
    removeItem(productId);
    return;
  }

  Cart.updateQty(productId, newQty);

  // Update UI without full re-render
  const qtyEl = document.getElementById(`qty${productId}`);
  const subtotalEl = document.getElementById(`subtotal${productId}`);
  if (qtyEl) qtyEl.textContent = newQty;

  const product = getProductById(productId);
  if (subtotalEl && product) {
    subtotalEl.textContent = formatINR(product.price * newQty);
  }

  renderSummary(Cart.get());
};

// ─── Remove Item ──────────────────────────────────────────────
window.removeItem = function(productId) {
  const itemEl = document.getElementById(`cartItem${productId}`);
  if (itemEl) {
    itemEl.classList.add("removing");
    setTimeout(() => {
      Cart.remove(productId);
      renderCart();
    }, 350);
  }
};

// ─── Clear Cart ───────────────────────────────────────────────
window.clearCartConfirm = function() {
  if (Cart.count() === 0) return;
  const confirmed = confirm("Are you sure you want to clear your entire crate?");
  if (confirmed) {
    Cart.clear();
    renderCart();
    Toast.show("Crate cleared.", "info");
  }
};

// ─── Promo Code ───────────────────────────────────────────────
window.applyPromo = function() {
  const code = document.getElementById("promoInput")?.value?.trim().toUpperCase();
  const msgEl = document.getElementById("promoMsg");

  if (!code) {
    showPromoMsg("Please enter a promo code.", "error");
    return;
  }

  if (promoApplied) {
    showPromoMsg("A promo code is already applied.", "error");
    return;
  }

  if (PROMO_CODES[code]) {
    promoApplied = true;
    showPromoMsg(`✓ ${PROMO_CODES[code].label}`, "success");
    renderSummary(Cart.get());
  } else {
    showPromoMsg("Invalid promo code. Try: CRATE10, ARTISAN, or WELCOME", "error");
  }
};

function showPromoMsg(message, type) {
  const el = document.getElementById("promoMsg");
  el.textContent = message;
  el.className = `promo-msg ${type}`;
}

// ─── Empty State Suggestions ──────────────────────────────────
function renderEmptySuggestions() {
  const container = document.getElementById("emptySuggestions");
  if (!container) return;

  const suggestions = TCC_PRODUCTS.filter(p => p.rating >= 4.8).slice(0, 4);
  container.innerHTML = `
    <h3 style="grid-column:1/-1;font-family:var(--font-display);font-size:1.4rem;font-weight:400;color:var(--clr-walnut);text-align:center;margin-bottom:var(--space-md)">
      You might love these
    </h3>
    ${suggestions.map(p => `
      <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer">
        <div class="product-card-image">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>
        <div class="product-card-body">
          <h3 class="product-card-name">${p.name}</h3>
          <p class="product-artisan-mini">By ${p.artisan.name}</p>
          <p class="product-price">${formatINR(p.price)}</p>
        </div>
      </div>
    `).join("")}
  `;
}
