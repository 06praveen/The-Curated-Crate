/**
 * home.js — The Curated Crate
 * Home page: navbar, products, categories, counter animation
 */

document.addEventListener("DOMContentLoaded", async () => {
  await window.initProducts();
  // Render navbar
  renderNavbar("home");
  setupNavbarScroll();

  // Hero image parallax + load animation
  const heroBgImg = document.getElementById("heroBgImg");
  if (heroBgImg) {
    heroBgImg.onload = () => heroBgImg.classList.add("loaded");
    if (heroBgImg.complete) heroBgImg.classList.add("loaded");
  }

  // Render sections
  renderHomeProducts("all");
  renderCategories();

  // Counter animation on scroll
  initCounters();
});

// ─── Navbar Scroll Effect ─────────────────────────────────────
function setupNavbarScroll() {
  const nav = document.getElementById("tcc-navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}

// ─── Products Grid ─────────────────────────────────────────────
let currentCategory = "all";

function renderHomeProducts(category) {
  currentCategory = category;
  const grid = document.getElementById("homeProductsGrid");
  if (!grid) return;

  const products = category === "all"
    ? TCC_PRODUCTS.slice(0, 8)
    : TCC_PRODUCTS.filter(p => p.category.toLowerCase() === category).slice(0, 8);

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔍</div>
        <h3>No crafts found</h3>
        <p>Try a different category</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => renderProductCard(p)).join("");

  // Animate in
  grid.querySelectorAll(".product-card").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(24px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 60);
  });
}

function renderProductCard(p) {
  const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  return `
    <div class="product-card" onclick="goToProduct(${p.id})" tabindex="0" role="button"
         onkeydown="if(event.key==='Enter') goToProduct(${p.id})">
      <div class="product-card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge ${p.badge === 'Signature' || p.badge === 'Rare Craft' ? 'gold' : ''}">${p.badge}</span>` : ''}
        <button class="product-card-add" onclick="addToCartFromCard(event, ${p.id})" aria-label="Add to cart">+</button>
      </div>
      <div class="product-card-body">
        <div class="product-card-meta">
          <span class="product-category">${p.category}</span>
          <span style="font-size:0.7rem;color:var(--clr-sage);font-weight:600">${p.artisan.impact}</span>
        </div>
        <h3 class="product-card-name">${p.name}</h3>
        <p class="product-artisan-mini">By ${p.artisan.name} · ${p.artisan.village}</p>
        <div class="product-rating">
          ${renderStars(p.rating)}
          <span class="rating-num">${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-price-row">
          <div>
            <span class="product-price">${formatINR(p.price)}</span>
            <span class="product-price-original" style="margin-left:8px">${formatINR(p.originalPrice)}</span>
          </div>
          <span class="tag" style="border-color:var(--clr-sage);color:var(--clr-sage)">${discount}% off</span>
        </div>
      </div>
    </div>
  `;
}

function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function addToCartFromCard(e, productId) {
  e.stopPropagation();
  Cart.add(productId);
}

// ─── Category Filter ──────────────────────────────────────────
window.filterProducts = function(category, btn) {
  document.querySelectorAll(".product-filters .tag").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderHomeProducts(category);
};

// ─── Categories Grid ──────────────────────────────────────────
function renderCategories() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  grid.innerHTML = TCC_CATEGORIES.map((cat, i) => `
    <a href="product.html?category=${cat.id}"
       class="category-card reveal ${i > 0 ? `delay-${Math.min(i, 5)}` : ''}">
      <img src="${cat.image}" alt="${cat.name}" loading="lazy">
      <div class="category-card-overlay"></div>
      <div class="category-card-content">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-name">${cat.name}</span>
        <span class="category-count">${cat.count} crafts</span>
      </div>
    </a>
  `).join("");

  // Re-init scroll reveal for dynamically added elements
  initScrollReveal();
}

// ─── Counter Animation ────────────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll(".impact-num");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute("data-target"));
  const duration = 1800;
  const start = performance.now();

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ─── Newsletter ───────────────────────────────────────────────
window.subscribeNewsletter = function(e) {
  e.preventDefault();
  const input = document.getElementById("newsletterEmail");
  const email = input?.value?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Toast.show("Please enter a valid email address.", "error");
    return;
  }

  input.value = "";
  Toast.show("🎉 You're on the list! Welcome to the crate community.", "success", 4000);
};
