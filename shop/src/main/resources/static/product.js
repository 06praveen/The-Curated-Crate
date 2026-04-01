/**
 * product.js — The Curated Crate
 * Product listing: search, filter, sort, modal
 */

let currentProducts = [...TCC_PRODUCTS];
let activeModal = null;
let modalQty = 1;

document.addEventListener("DOMContentLoaded", async () => {
  await window.initProducts();
  currentProducts = [...TCC_PRODUCTS];
  renderNavbar("products");
  setupNavbarScroll();
  buildCategoryFilters();

  // URL params
  const params = new URLSearchParams(window.location.search);
  const searchQ = params.get("search");
  const category = params.get("category");
  const productId = params.get("id");

  if (searchQ) {
    document.getElementById("productSearch").value = searchQ;
    document.getElementById("searchClear").style.display = "flex";
    document.getElementById("pageTitle").textContent = `Search: "${searchQ}"`;
  }

  if (category) {
    // Select matching radio
    const radio = document.querySelector(`input[name="category"][value="${category}"]`);
    if (radio) {
      radio.checked = true;
      document.getElementById("pageTitle").textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Crafts`;
    }
  }

  applyFilters();

  if (productId) {
    // Auto-open modal for direct product link
    setTimeout(() => openModal(parseInt(productId)), 400);
  }
});

function setupNavbarScroll() {
  const nav = document.getElementById("tcc-navbar");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
}

// ─── Build Category Filters ───────────────────────────────────
function buildCategoryFilters() {
  const container = document.getElementById("categoryFilters");
  const categories = [...new Set(TCC_PRODUCTS.map(p => p.category))];

  container.innerHTML = `
    <label class="sidebar-radio">
      <input type="radio" name="category" value="all" checked onchange="applyFilters()">
      <span>All Crafts</span>
      <span class="filter-count">${TCC_PRODUCTS.length}</span>
    </label>
    ${categories.map(cat => {
      const count = TCC_PRODUCTS.filter(p => p.category === cat).length;
      return `
        <label class="sidebar-radio">
          <input type="radio" name="category" value="${cat.toLowerCase()}" onchange="applyFilters()">
          <span>${cat}</span>
          <span class="filter-count">${count}</span>
        </label>
      `;
    }).join("")}
  `;
}

// ─── Filtering & Sorting ──────────────────────────────────────
window.applyFilters = function() {
  const search = document.getElementById("productSearch").value.trim().toLowerCase();
  const category = document.querySelector('input[name="category"]:checked')?.value || "all";
  const minRating = parseFloat(document.querySelector('input[name="rating"]:checked')?.value || "0");
  const minPrice = parseFloat(document.getElementById("priceMin").value) || 0;
  const maxPrice = parseFloat(document.getElementById("priceMax").value) || Infinity;
  const sort = document.getElementById("sortSelect").value;

  let products = [...TCC_PRODUCTS];

  // Search
  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search) ||
      p.tags.some(t => t.includes(search)) ||
      p.artisan.name.toLowerCase().includes(search) ||
      p.artisan.village.toLowerCase().includes(search)
    );
  }

  // Category
  if (category !== "all") {
    products = products.filter(p => p.category.toLowerCase() === category);
  }

  // Rating
  if (minRating > 0) {
    products = products.filter(p => p.rating >= minRating);
  }

  // Price
  products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);

  // Sort
  switch (sort) {
    case "price-asc":   products.sort((a, b) => a.price - b.price); break;
    case "price-desc":  products.sort((a, b) => b.price - a.price); break;
    case "rating":      products.sort((a, b) => b.rating - a.rating); break;
    case "discount":    products.sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price)); break;
    default: break;
  }

  currentProducts = products;
  renderGrid(products);
  updateResultsCount(products.length);

  // Clear button
  const clear = document.getElementById("searchClear");
  if (clear) clear.style.display = search ? "flex" : "none";
};

window.handleSearch = applyFilters;
window.handleSort = applyFilters;

window.clearSearch = function() {
  document.getElementById("productSearch").value = "";
  applyFilters();
};

window.clearAllFilters = function() {
  document.getElementById("productSearch").value = "";
  document.getElementById("priceMin").value = "";
  document.getElementById("priceMax").value = "";
  document.querySelectorAll('input[name="category"]')[0].checked = true;
  document.querySelectorAll('input[name="rating"]')[0].checked = true;
  document.getElementById("sortSelect").value = "featured";
  applyFilters();
};

// ─── Render Grid ──────────────────────────────────────────────
function renderGrid(products) {
  const grid = document.getElementById("productsGrid");
  const empty = document.getElementById("emptyState");

  if (!products.length) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="openModal(${p.id})" tabindex="0" role="button"
         onkeydown="if(event.key==='Enter') openModal(${p.id})">
      <div class="product-card-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge ${['Signature','Rare Craft','GI Tagged'].includes(p.badge) ? 'gold' : ''}">${p.badge}</span>` : ''}
        <button class="product-card-add" onclick="quickAddCart(event, ${p.id})" aria-label="Add to cart">+</button>
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
        </div>
      </div>
    </div>
  `).join("");

  // Animate in
  grid.querySelectorAll(".product-card").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.45s ease, transform 0.45s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 50);
  });
}

function updateResultsCount(count) {
  const el = document.getElementById("resultsCount");
  if (el) el.textContent = `${count} craft${count !== 1 ? "s" : ""}`;
}

// ─── Modal ────────────────────────────────────────────────────
window.openModal = function(productId) {
  const p = getProductById(productId);
  if (!p) return;

  activeModal = p;
  modalQty = 1;

  const modal = document.getElementById("productModal");

  // Fill data
  document.getElementById("modalImg").src = p.image;
  document.getElementById("modalImg").alt = p.name;
  document.getElementById("modalCategory").textContent = p.category.toUpperCase();
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalPrice").textContent = formatINR(p.price);
  document.getElementById("modalPriceOrig").textContent = formatINR(p.originalPrice);
  const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  document.getElementById("modalDiscount").textContent = `${discount}% off`;
  document.getElementById("modalDescription").textContent = p.description;
  document.getElementById("modalQty").textContent = "1";

  // Rating
  document.getElementById("modalRating").innerHTML = `
    ${renderStars(p.rating)}
    <span class="rating-num" style="font-size:0.85rem">${p.rating} · ${p.reviews} reviews</span>
  `;

  // Tags
  document.getElementById("modalTags").innerHTML = p.tags.map(t =>
    `<span class="tag">#${t}</span>`
  ).join("");

  // Badge
  document.getElementById("modalBadgeRow").innerHTML = p.badge
    ? `<span class="product-badge ${['Signature','Rare Craft','GI Tagged'].includes(p.badge) ? 'gold' : ''}">${p.badge}</span>`
    : "";

  // Artisan
  document.getElementById("asbPhoto").src = p.artisan.photo;
  document.getElementById("asbPhoto").alt = p.artisan.name;
  document.getElementById("asbName").textContent = p.artisan.name;
  document.getElementById("asbLocation").textContent = `Age ${p.artisan.age} · ${p.artisan.village}`;
  document.getElementById("asbStory").textContent = `"${p.artisan.story}"`;
  document.getElementById("asbImpact").innerHTML = `<span>💚</span> ${p.artisan.impact} · Purchase supports them directly`;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeModal = function(e) {
  if (e.target === document.getElementById("productModal")) {
    closeModalDirect();
  }
};

window.closeModalDirect = function() {
  document.getElementById("productModal").classList.remove("open");
  document.body.style.overflow = "";
  activeModal = null;
};

window.changeModalQty = function(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById("modalQty").textContent = modalQty;
};

window.addModalToCart = function() {
  if (!activeModal) return;
  Cart.add(activeModal.id, modalQty);
  closeModalDirect();
};

window.quickAddCart = function(e, productId) {
  e.stopPropagation();
  Cart.add(productId);
};

// ESC key closes modal
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModalDirect();
});
