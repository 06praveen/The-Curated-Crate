/**
 * checkout.js — The Curated Crate
 * 3-step checkout: address → payment → review → order placed
 */

let currentStep = 1;
let addressData = {};
let paymentData = {};

document.addEventListener("DOMContentLoaded", async () => {
  await window.initProducts();
  Auth.requireAuth();
  renderNavbar("checkout");
  setupNavbarScroll();

  // Pre-fill user name/phone from profile
  const user = Auth.getCurrentUser();
  if (user) {
    document.getElementById("cName").value = user.name || "";
    document.getElementById("cPhone").value = user.phone || "";
  }

  renderCheckoutSidebar();
  goToStep(1);

  // Address form submit
  document.getElementById("addressForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateAddress()) goToStep(2);
  });
});

function setupNavbarScroll() {
  const nav = document.getElementById("tcc-navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}

// ─── Step Navigation ──────────────────────────────────────────
window.goToStep = function(step) {
  // Hide all panels
  ["panelAddress", "panelPayment", "panelReview", "panelSuccess"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Update step indicators
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById(`step${i}ind`);
    if (!ind) continue;
    ind.classList.remove("active", "completed");
    if (i < step) ind.classList.add("completed");
    if (i === step) ind.classList.add("active");
  }

  // Update step lines
  document.querySelectorAll(".step-line").forEach((line, idx) => {
    line.classList.toggle("completed", idx + 1 < step);
  });

  // Show target panel
  if (step === 1) document.getElementById("panelAddress")?.classList.remove("hidden");
  if (step === 2) document.getElementById("panelPayment")?.classList.remove("hidden");
  if (step === 3) {
    renderReview();
    document.getElementById("panelReview")?.classList.remove("hidden");
  }

  currentStep = step;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ─── Address Validation ───────────────────────────────────────
function validateAddress() {
  let valid = true;
  const fields = [
    { id: "cName",    errId: "cNameErr",    msg: "Please enter the recipient's name." },
    { id: "cPhone",   errId: "cPhoneErr",   msg: "Please enter a valid 10-digit phone number." },
    { id: "cAddress", errId: "cAddressErr", msg: "Please enter your street address." },
    { id: "cCity",    errId: "cCityErr",    msg: "Please enter your city." },
    { id: "cState",   errId: "cStateErr",   msg: "Please select your state." },
    { id: "cPin",     errId: "cPinErr",     msg: "Please enter a valid 6-digit PIN code." }
  ];

  fields.forEach(({ id, errId, msg }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errId);
    const val = input?.value?.trim();
    const ok =
      id === "cPhone" ? /^\d{10}$/.test(val) :
      id === "cPin"   ? /^\d{6}$/.test(val) :
      val && val.length >= 2;

    if (!ok) {
      if (errEl) { errEl.textContent = msg; errEl.classList.add("show"); }
      input.style.borderColor = "#c0392b";
      if (valid) { valid = false; input.focus(); }
    } else {
      if (errEl) { errEl.textContent = ""; errEl.classList.remove("show"); }
      input.style.borderColor = "#8A9B7E";
    }
  });

  if (valid) {
    // Store address
    addressData = {
      name: document.getElementById("cName").value.trim(),
      phone: document.getElementById("cPhone").value.trim(),
      street: document.getElementById("cAddress").value.trim(),
      city: document.getElementById("cCity").value.trim(),
      state: document.getElementById("cState").value,
      pin: document.getElementById("cPin").value.trim(),
      type: document.querySelector('input[name="addrType"]:checked')?.value || "Home"
    };
  }

  return valid;
}

// ─── Payment UI Toggle ────────────────────────────────────────
window.updatePaymentUI = function() {
  const selected = document.querySelector('input[name="payment"]:checked')?.value;
  ["upiPanel", "cardPanel", "netbankingPanel", "codPanel"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  const map = { upi: "upiPanel", card: "cardPanel", netbanking: "netbankingPanel", cod: "codPanel" };
  if (map[selected]) document.getElementById(map[selected])?.classList.remove("hidden");

  paymentData.method = selected;
};

// Card number format
window.formatCardNum = function(input) {
  let val = input.value.replace(/\D/g, "").slice(0, 16);
  input.value = val.replace(/(.{4})/g, "$1 ").trim();
};

// Expiry format
window.formatExpiry = function(input) {
  let val = input.value.replace(/\D/g, "").slice(0, 4);
  if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
  input.value = val;
};

// ─── Review Panel ─────────────────────────────────────────────
function renderReview() {
  const cart = Cart.get();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || "upi";
  const paymentLabels = { upi: "UPI", card: "Credit/Debit Card", netbanking: "Net Banking", cod: "Cash on Delivery" };

  const subtotal = Cart.total();
  const shipping = subtotal >= 1500 ? 0 : 99;
  const total = subtotal + shipping;

  document.getElementById("reviewContent").innerHTML = `
    <div class="review-section review-address">
      <h4>📍 Delivering To</h4>
      <p><strong>${addressData.name}</strong></p>
      <p>${addressData.street}, ${addressData.city}, ${addressData.state} — ${addressData.pin}</p>
      <p>📞 ${addressData.phone}</p>
    </div>

    <div class="review-section review-payment">
      <h4>💳 Payment Method</h4>
      <p>${paymentLabels[payment] || "UPI"}</p>
    </div>

    <div class="review-section">
      <h4>🎁 Items in Your Crate</h4>
      ${cart.map(item => {
        const p = getProductById(item.productId);
        if (!p) return "";
        return `
          <div class="review-item">
            <div class="review-item-img"><img src="${p.image}" alt="${p.name}"></div>
            <div class="review-item-name">
              ${p.name}
              <span style="display:block;font-size:0.72rem;color:var(--clr-text-muted)">By ${p.artisan.name}</span>
            </div>
            <span class="review-item-qty">×${item.qty}</span>
            <span class="review-item-price">${formatINR(p.price * item.qty)}</span>
          </div>
        `;
      }).join("")}
    </div>

    <div class="review-section">
      <h4>💰 Price Breakup</h4>
      <div class="co-total-line"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
      <div class="co-total-line"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
      <div class="co-total-final"><span>Total Payable</span><span>${formatINR(total)}</span></div>
    </div>
  `;

  paymentData = { method: payment, label: paymentLabels[payment] };
}

// ─── Checkout Sidebar ─────────────────────────────────────────
function renderCheckoutSidebar() {
  const cart = Cart.get();
  const subtotal = Cart.total();
  const shipping = subtotal >= 1500 ? 0 : 99;
  const total = subtotal + shipping;

  document.getElementById("checkoutItemsList").innerHTML = cart.map(item => {
    const p = getProductById(item.productId);
    if (!p) return "";
    return `
      <div class="co-item">
        <div class="co-item-img"><img src="${p.image}" alt="${p.name}"></div>
        <div>
          <span class="co-item-name">${p.name}<span class="co-item-qty">×${item.qty}</span></span>
        </div>
        <span class="co-item-price">${formatINR(p.price * item.qty)}</span>
      </div>
    `;
  }).join("");

  document.getElementById("checkoutTotalSection").innerHTML = `
    <div class="co-total-line"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
    <div class="co-total-line"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
    <div class="co-total-final"><span>Total</span><span>${formatINR(total)}</span></div>
  `;
}

// ─── Place Order ──────────────────────────────────────────────
window.placeOrder = async function() {
  const btn = document.getElementById("placeOrderBtn");
  const placeText = document.getElementById("placeText");
  const placeSpinner = document.getElementById("placeSpinner");

  btn.disabled = true;
  placeText.style.display = "none";
  placeSpinner.style.display = "flex";

  await new Promise(r => setTimeout(r, 1800));

  const cart = Cart.get();
  const subtotal = Cart.total();
  const shipping = subtotal >= 1500 ? 0 : 99;
  const total = subtotal + shipping;

  const artisanCount = [...new Set(cart.map(c => getProductById(c.productId)?.artisan?.name).filter(Boolean))].length;

  const order = await Orders.place({
    items: cart.map(i => {
      const p = getProductById(i.productId);
      return { productId: i.productId, name: p?.name, qty: i.qty, price: p?.price };
    }),
    total,
    address: addressData,
    payment: paymentData.label,
    artisanCount
  });

  // Show success
  ["panelAddress","panelPayment","panelReview"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  // Update step indicators to completed
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`step${i}ind`)?.classList.add("completed");
    document.getElementById(`step${i}ind`)?.classList.remove("active");
  }

  document.getElementById("successOrderId").textContent = `Order ID: ${order.id}`;

  // Delivery date = 5-7 business days
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 6);
  document.getElementById("deliveryDate").textContent = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });

  document.getElementById("successImpact").textContent =
    `This order directly supports ${artisanCount} artisan${artisanCount !== 1 ? 's' : ''} and their families. Thank you for choosing conscious commerce.`;

  document.getElementById("panelSuccess").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
