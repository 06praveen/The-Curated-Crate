-- ============================================================
-- The Curated Crate — MySQL Database Schema
-- Run this SQL file against your MySQL instance
-- Usage: mysql -u root -p < schema.sql
-- ============================================================

-- Create and select database
CREATE DATABASE IF NOT EXISTS curated_crate_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE curated_crate_db;

-- ─── ARTISANS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artisans (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    village     VARCHAR(150)  NOT NULL,
    age         INT           NOT NULL,
    story       TEXT          NOT NULL,
    impact      VARCHAR(100)  NOT NULL,
    photo_url   VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200)   NOT NULL,
    category        VARCHAR(50)    NOT NULL,
    price           DECIMAL(10,2)  NOT NULL,
    original_price  DECIMAL(10,2)  NOT NULL,
    rating          DECIMAL(3,1)   DEFAULT 4.5,
    reviews         INT            DEFAULT 0,
    image_url       VARCHAR(500),
    description     TEXT,
    badge           VARCHAR(50),
    artisan_id      BIGINT,
    in_stock        BOOLEAN        DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE SET NULL
);

-- ─── PRODUCT TAGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_tags (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT      NOT NULL,
    tag         VARCHAR(50) NOT NULL,
    CONSTRAINT fk_tag_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,  -- BCrypt hash
    phone       VARCHAR(15),
    role        ENUM('USER','ADMIN') DEFAULT 'USER',
    enabled     BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── CART ITEMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT  NOT NULL,
    product_id  BIGINT  NOT NULL,
    quantity    INT     NOT NULL DEFAULT 1,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─── ADDRESSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    street          VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pin_code        VARCHAR(10)  NOT NULL,
    address_type    ENUM('Home','Work','Other') DEFAULT 'Home',
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ORDERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number    VARCHAR(30)   NOT NULL UNIQUE,  -- e.g., TCC1234567890
    user_id         BIGINT        NOT NULL,
    address_id      BIGINT,
    subtotal        DECIMAL(10,2) NOT NULL,
    shipping        DECIMAL(10,2) DEFAULT 0.00,
    discount        DECIMAL(10,2) DEFAULT 0.00,
    total           DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(50)   DEFAULT 'UPI',
    status          ENUM('CONFIRMED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
                    DEFAULT 'CONFIRMED',
    artisan_count   INT DEFAULT 1,
    placed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user    FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_order_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT        NOT NULL,
    product_id  BIGINT,
    name        VARCHAR(200)  NOT NULL,   -- snapshot at time of order
    price       DECIMAL(10,2) NOT NULL,
    quantity    INT           NOT NULL,
    image_url   VARCHAR(500),
    CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE,
    plan        ENUM('MONTHLY','QUARTERLY','ANNUAL') NOT NULL,
    status      ENUM('ACTIVE','CANCELLED','PAUSED') DEFAULT 'ACTIVE',
    started_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_date   DATE,
    cancelled_at TIMESTAMP,
    CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── USER PREFERENCES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE,
    categories  TEXT,           -- comma-separated: textiles,pottery
    regions     TEXT,           -- comma-separated: rajasthan,kashmir
    price_range VARCHAR(20) DEFAULT 'mid',
    notif_new   BOOLEAN DEFAULT TRUE,
    notif_offers BOOLEAN DEFAULT TRUE,
    notif_stories BOOLEAN DEFAULT FALSE,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA — Artisans (12 records)
-- ============================================================
INSERT INTO artisans (name, village, age, story, impact, photo_url) VALUES
('Sunita Devi',    'Madhubani, Bihar',        47, 'Sunita has been painting the ancient Madhubani tradition since age 12, passed down through 6 generations of women in her family. Each wrap takes 3 weeks to complete.',  'Supports 3 artisans',  'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=200&q=80'),
('Rajan Mistri',   'Bastar, Chhattisgarh',    58, 'Rajan uses the 4,000-year-old lost-wax Dhokra casting technique. No two pieces are identical — each is a meditation in metal. He is one of only 40 remaining Dhokra masters.', 'Supports 2 artisans', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&q=80'),
('Mohammad Yusuf', 'Jaipur, Rajasthan',       43, 'Yusuf''s workshop in the old city of Jaipur has produced Blue Pottery for three generations. The cobalt pigments are still sourced from the same mountains as his grandfather used.', 'Supports 5 artisans', 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80'),
('Ghulam Rasool',  'Srinagar, Kashmir',       61, 'Ghulam has woven Pashmina for 40 years. Each shawl takes 72 hours of hand-spinning and 2 weeks of weaving. He says: I don t make shawls. I make warmth with memory.', 'Supports 4 artisans', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&q=80'),
('Jyoti Tekam',    'Palghar, Maharashtra',    34, 'Jyoti paints with rice flour paste on mud-washed cloth, a tradition unchanged for centuries. Her art documents the Warli community rituals, harvests, and forest spirits.', 'Supports 2 artisans', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80'),
('Priya Nambiar',  'Kutch, Gujarat',          39, 'Priya revived the traditional indigo vat dyeing process in her village after it nearly disappeared. She trained 12 local women, creating a cooperative that now exports globally.', 'Supports 12 artisans', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80'),
('Rekha Mondal',   'Bishnupur, West Bengal',  52, 'Rekha learned Kantha running stitches from her grandmother at age 8. She now leads a collective of 20 women who transform recycled saris into wearable storytelling.', 'Supports 8 artisans', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80'),
('Ramu Kumbhar',   'Pune, Maharashtra',       55, 'Ramu fires his pots in an earth kiln using dry mango wood — the same method for 200 years. Pottery is not just his job; it s his prayer.', 'Supports 1 artisan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80'),
('Suresh Mohapatra','Raghurajpur, Odisha',    49, 'Suresh paints scenes from the Mahabharata using home-made pigments from stones, flowers and shells. GI-tagged. His village is a living heritage site.', 'Supports 3 artisans', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80'),
('Anil Barman',    'Majuli, Assam',           41, 'Anil lives on the world s largest river island, Majuli, where bamboo crafting is a way of life. His lunch box design has won a national craft award.', 'Supports 2 artisans', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80'),
('Nagesh Tantri',  'Channapatna, Karnataka',  36, 'Known as Toy Town, Channapatna tradition dates to Tipu Sultan s reign. Nagesh uses rosewood painted with natural plant-based lacquers — 100% safe for children.', 'Supports 6 artisans', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'),
('Kamlesh Maurya', 'Varanasi, Uttar Pradesh', 45, 'Kamlesh weaves on a traditional pit loom in the lanes of Varanasi. His family has woven Banarasi silk for 7 generations. Each cushion takes 18 hours to weave.', 'Supports 4 artisans', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80');

-- ============================================================
-- SEED DATA — Products (12 records)
-- ============================================================
INSERT INTO products (name, category, price, original_price, rating, reviews, image_url, description, badge, artisan_id) VALUES
('Madhubani Silk Wrap',        'Textiles',   3200,  4500,  4.9, 128, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80', 'Hand-painted Madhubani silk wrap featuring traditional peacock and lotus motifs. Each piece is one-of-a-kind, made on authentic Bhagalpuri silk.', 'Bestseller', 1),
('Bronze Dhokra Elephant',     'Sculptures', 5800,  7200,  4.8,  94, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 'A stunning Dhokra cast elephant in solid bronze alloy, finished by hand. A timeless piece of living heritage.',  'Rare Craft', 2),
('Blue Pottery Tea Set',       'Pottery',    4200,  5500,  4.7, 211, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80', '6-piece Blue Pottery tea set in the classic Jaipur style. Quartz-based clay fired at low temperature for that signature translucent glow.', 'New Arrival', 3),
('Kashmiri Pashmina Shawl',    'Textiles',  12800, 18000,  5.0,  67, 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&q=80', 'Authentic Grade A Pashmina from Changthangi goats. Hand-spun, hand-woven, and finished by master weavers in the Kashmir Valley.', 'Signature', 4),
('Warli Tribal Wall Art',      'Art',        2800,  3600,  4.6, 183, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80', 'Large format Warli painting on handmade paper depicting the harvest festival. Each geometric figure tells a story of community and nature.', 'Cultural Heritage', 5),
('Organic Indigo Linen Set',   'Home',       6500,  8800,  4.8, 142, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80', 'Natural indigo-dyed linen bed set (1 duvet cover + 2 pillowcases). Plant-based dyes, no synthetic chemicals. Softens with each wash.', 'Eco Certified', 6),
('Kantha Embroidery Jacket',   'Apparel',    7200,  9500,  4.9,  89, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', 'Upcycled silk sari jacket with full Kantha hand-embroidery. 40,000+ running stitches per piece. A work of art you can wear.', 'Slow Fashion', 7),
('Terracotta Planter Set',     'Pottery',    1800,  2400,  4.5, 267, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80', 'Set of 3 hand-thrown terracotta planters in graduating sizes. Porous, breathable, and beautifully rustic — ideal for succulents and herbs.', 'Handthrown', 8),
('Pattachitra Silk Painting',  'Art',        9800, 14000,  4.9,  44, 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80', 'Original Pattachitra painting on treated cloth depicting the ten avatars of Vishnu. Natural pigments, gold leaf accents, signed by the artist.', 'GI Tagged', 9),
('Bamboo Weave Lunch Box',     'Home',       1200,  1600,  4.6, 312, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', 'Handwoven bamboo lunch box with airtight natural leaf clasp. Biodegradable, toxin-free, and surprisingly lightweight.', 'Award Winner', 10),
('Channapatna Wooden Toys',    'Gifts',      1500,  2000,  4.7, 189, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80', 'Set of 5 traditional Channapatna lacquerware toys — spinning tops, animals, and dolls. Heirloom quality, non-toxic, and endlessly charming.', 'Kid Safe', 11),
('Banaras Brocade Cushion Set','Home',       4800,  6500,  4.8, 156, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', 'Set of 4 Banarasi silk brocade cushion covers with zari weave floral pattern. Rich, heavy, and utterly luxurious.', 'Heritage Weave', 12);

-- ──── Product Tags ────────────────────────────────────────────
INSERT INTO product_tags (product_id, tag) VALUES
(1,'handwoven'),(1,'silk'),(1,'festive'),
(2,'bronze'),(2,'tribal'),(2,'decor'),
(3,'pottery'),(3,'jaipur'),(3,'gifting'),
(4,'pashmina'),(4,'kashmir'),(4,'luxury'),
(5,'warli'),(5,'tribal'),(5,'wall-art'),
(6,'indigo'),(6,'linen'),(6,'natural-dye'),
(7,'kantha'),(7,'embroidery'),(7,'wearable-art'),
(8,'terracotta'),(8,'planters'),(8,'home-decor'),
(9,'pattachitra'),(9,'silk'),(9,'odisha'),
(10,'bamboo'),(10,'sustainable'),(10,'kitchen'),
(11,'wooden'),(11,'toys'),(11,'channapatna'),
(12,'banaras'),(12,'brocade'),(12,'cushions');

-- ──── Demo admin user (password: admin1234) ───────────────────
-- BCrypt hash for 'admin1234'
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin', 'admin@curatedcrate.in', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8RqtBsHbGaGTuDOIlS', '9000000000', 'ADMIN');
