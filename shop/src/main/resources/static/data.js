/**
 * data.js — The Curated Crate
 * Mock product catalogue with artisan stories
 */

let TCC_PRODUCTS = [];

window.initProducts = async function() {
    try {
        const res = await fetch("/api/products");
        if (res.ok) {
            const raw = await res.json();
            TCC_PRODUCTS = raw.map(p => ({
                ...p,
                image: p.imageUrl,
                artisan: { ...p.artisan, photo: p.artisan.photoUrl }
            }));
        }
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            await Cart.sync();
        }
    } catch (e) { console.error("Could not load products from backend", e); }
};

const TCC_CATEGORIES = [
  { id: "textiles", name: "Textiles", icon: "🧵", count: 3, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80" },
  { id: "pottery", name: "Pottery", icon: "🏺", count: 2, image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80" },
  { id: "sculptures", name: "Sculptures", icon: "🗿", count: 1, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "art", name: "Art & Paintings", icon: "🎨", count: 2, image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80" },
  { id: "home", name: "Home Décor", icon: "🏡", count: 3, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80" },
  { id: "apparel", name: "Apparel", icon: "👘", count: 1, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80" },
  { id: "gifts", name: "Gifts", icon: "🎁", count: 1, image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80" }
];

// Helper to get product by id
function getProductById(id) {
  return TCC_PRODUCTS.find(p => p.id === parseInt(id));
}

// Helper to get products by category
function getProductsByCategory(category) {
  if (!category || category === "all") return TCC_PRODUCTS;
  return TCC_PRODUCTS.filter(p => p.category.toLowerCase() === category.toLowerCase());
}

// Helper to search products
function searchProducts(query) {
  const q = query.toLowerCase();
  return TCC_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.tags.some(t => t.includes(q)) ||
    p.artisan.name.toLowerCase().includes(q) ||
    p.artisan.village.toLowerCase().includes(q)
  );
}
