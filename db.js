/* =========================================================
   db.js — Local "database" layer using localStorage
   Acts as a stand-in for a real backend/database.
   ========================================================= */

const DB_KEYS = {
  USERS: 'ecom_users',
  PRODUCTS: 'ecom_products',
  CART: 'ecom_cart',          // cart is per logged-in user, keyed inside object
  ORDERS: 'ecom_orders',
  SESSION: 'ecom_session',
  INIT_FLAG: 'ecom_initialized',
  WISHLIST: 'ecom_wishlist'
};

/* ---------- generic helpers ---------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('Failed to parse', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

/* simple hash so passwords aren't sitting in plain text in localStorage.
   NOTE: this is NOT secure crypto — fine for a demo/local project only. */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'h' + Math.abs(hash).toString(36) + str.length;
}

/* ---------- seed data (runs once) ---------- */
function seedDatabase() {
  if (localStorage.getItem(DB_KEYS.INIT_FLAG)) return;

  const defaultUsers = [
    {
      id: genId('user'),
      name: 'Admin',
      email: 'admin@tokoku.demo',
      password: simpleHash('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('user'),
      name: 'Pelanggan Demo',
      email: 'pelanggan@tokoku.demo',
      password: simpleHash('pelanggan123'),
      role: 'user',
      createdAt: new Date().toISOString()
    }
  ];

  const defaultProducts = [
    {
      id: genId('prod'),
      name: 'Headphone Nirkabel',
      description: 'Headphone over-ear nirkabel dengan peredam bising dan daya tahan baterai hingga 30 jam.',
      price: 1200000,
      stock: 25,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Jam Tangan Pintar',
      description: 'Jam tangan pintar untuk kebugaran dengan pemantau detak jantung dan GPS.',
      price: 1950000,
      stock: 15,
      category: 'Elektronik',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Sepatu Lari',
      description: 'Sepatu lari ringan dan nyaman dengan sirkulasi udara yang baik untuk latihan harian.',
      price: 900000,
      stock: 40,
      category: 'Alas Kaki',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Tas Ransel',
      description: 'Tas ransel tahan air dengan kompartemen khusus laptop.',
      price: 675000,
      stock: 30,
      category: 'Aksesori',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Mesin Kopi',
      description: 'Mesin kopi tetes yang dapat diprogram dan mampu menyeduh hingga 12 cangkir.',
      price: 592500,
      stock: 20,
      category: 'Rumah Tangga',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Lampu Meja',
      description: 'Lampu meja LED dengan tingkat kecerahan yang dapat diatur dan port pengisian USB.',
      price: 374850,
      stock: 35,
      category: 'Rumah Tangga',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Serum Wajah Botanikal',
      description: 'Serum pelembap alami dari ekstrak tumbuhan untuk kulit segar dan glowing setiap hari.',
      price: 427500,
      stock: 30,
      category: 'Kecantikan',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Matras Yoga Ramah Lingkungan',
      description: 'Matras yoga anti-slip terbuat dari bahan alami dengan ketebalan optimal untuk kenyamanan sendi.',
      price: 510000,
      stock: 22,
      category: 'Olahraga',
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Kacamata Hitam Polarized',
      description: 'Kacamata hitam dengan proteksi UV400 dan bingkai minimalis yang ringan dan elegan.',
      price: 585000,
      stock: 18,
      category: 'Aksesori',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500',
      createdAt: new Date().toISOString()
    },
    {
      id: genId('prod'),
      name: 'Jaket Kasual Katun',
      description: 'Jaket kasual berbahan katun organik yang nyaman untuk aktivitas harian di segala cuaca.',
      price: 1020000,
      stock: 16,
      category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500',
      createdAt: new Date().toISOString()
    }
  ];

  writeJSON(DB_KEYS.USERS, defaultUsers);
  writeJSON(DB_KEYS.PRODUCTS, defaultProducts);
  writeJSON(DB_KEYS.ORDERS, []);
  writeJSON(DB_KEYS.CART, {});
  localStorage.setItem(DB_KEYS.INIT_FLAG, 'true');
}

seedDatabase();

function localizeDemoData() {
  const translations = {
    'Wireless Headphones': ['Headphone Nirkabel', 'Headphone over-ear nirkabel dengan peredam bising dan daya tahan baterai hingga 30 jam.', 'Elektronik'],
    'Smart Watch': ['Jam Tangan Pintar', 'Jam tangan pintar untuk kebugaran dengan pemantau detak jantung dan GPS.', 'Elektronik'],
    'Running Shoes': ['Sepatu Lari', 'Sepatu lari ringan dan nyaman dengan sirkulasi udara yang baik untuk latihan harian.', 'Alas Kaki'],
    'Backpack': ['Tas Ransel', 'Tas ransel tahan air dengan kompartemen khusus laptop.', 'Aksesori'],
    'Coffee Maker': ['Mesin Kopi', 'Mesin kopi tetes yang dapat diprogram dan mampu menyeduh hingga 12 cangkir.', 'Rumah Tangga'],
    'Desk Lamp': ['Lampu Meja', 'Lampu meja LED dengan tingkat kecerahan yang dapat diatur dan port pengisian USB.', 'Rumah Tangga']
  };
  let products = readJSON(DB_KEYS.PRODUCTS, []);
  let changed = false;

  products.forEach(product => {
    const translation = translations[product.name];
    if (!translation) return;
    [product.name, product.description, product.category] = translation;
    changed = true;
  });

  // Ensure category names are normalized and ensure rich items exist
  const existingNames = new Set(products.map(p => p.name));
  const extras = [
    {
      name: 'Serum Wajah Botanikal',
      description: 'Serum pelembap alami dari ekstrak tumbuhan untuk kulit segar dan glowing setiap hari.',
      price: 28.50,
      stock: 30,
      category: 'Kecantikan',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'
    },
    {
      name: 'Matras Yoga Ramah Lingkungan',
      description: 'Matras yoga anti-slip terbuat dari bahan alami dengan ketebalan optimal untuk kenyamanan sendi.',
      price: 34.00,
      stock: 22,
      category: 'Olahraga',
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'
    },
    {
      name: 'Kacamata Hitam Polarized',
      description: 'Kacamata hitam dengan proteksi UV400 dan bingkai minimalis yang ringan dan elegan.',
      price: 39.00,
      stock: 18,
      category: 'Aksesori',
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500'
    },
    {
      name: 'Jaket Kasual Katun',
      description: 'Jaket kasual berbahan katun organik yang nyaman untuk aktivitas harian di segala cuaca.',
      price: 68.00,
      stock: 16,
      category: 'Fashion',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500'
    }
  ];

  extras.forEach(extra => {
    if (!existingNames.has(extra.name)) {
      products.push({
        id: genId('prod'),
        ...extra,
        createdAt: new Date().toISOString()
      });
      changed = true;
    }
  });

  // Remap 'Alas Kaki' to 'Fashion' if desired for consistent categories
  products.forEach(p => {
    if (p.category === 'Alas Kaki') {
      p.category = 'Fashion';
      changed = true;
    }
  });

  if (changed) writeJSON(DB_KEYS.PRODUCTS, products);

  const users = readJSON(DB_KEYS.USERS, []);
  const demoUser = users.find(user => user.email === 'user@tokoku.demo' && user.name === 'Demo User');
  if (demoUser) {
    demoUser.name = 'Pengguna Demo';
    writeJSON(DB_KEYS.USERS, users);
  }
}

localizeDemoData();

/* ---------- Wishlist ---------- */
const WishlistDB = {
  getAll() {
    return readJSON('ecom_wishlist', []);
  },
  toggle(productId) {
    let list = this.getAll();
    const idx = list.indexOf(productId);
    let added = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
      added = true;
    }
    writeJSON('ecom_wishlist', list);
    return added;
  },
  has(productId) {
    return this.getAll().includes(productId);
  }
};

/* ---------- Users ---------- */
const UserDB = {
  getAll() {
    return readJSON(DB_KEYS.USERS, []);
  },
  findByEmail(email) {
    return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  create({ name, email, password, role = 'user' }) {
    const users = this.getAll();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Akun dengan email ini sudah terdaftar.');
    }
    const newUser = {
      id: genId('user'),
      name,
      email,
      password: simpleHash(password),
      role,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(DB_KEYS.USERS, users);
    return newUser;
  },
  verifyCredentials(email, password) {
    const user = this.findByEmail(email);
    if (!user) return null;
    if (user.password !== simpleHash(password)) return null;
    return user;
  }
};

/* ---------- Products ---------- */
const ProductDB = {
  getAll() {
    return readJSON(DB_KEYS.PRODUCTS, []);
  },
  getById(id) {
    return this.getAll().find(p => p.id === id);
  },
  create(product) {
    const products = this.getAll();
    const newProduct = {
      id: genId('prod'),
      createdAt: new Date().toISOString(),
      ...product
    };
    products.push(newProduct);
    writeJSON(DB_KEYS.PRODUCTS, products);
    return newProduct;
  },
  update(id, updates) {
    const products = this.getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan.');
    products[idx] = { ...products[idx], ...updates };
    writeJSON(DB_KEYS.PRODUCTS, products);
    return products[idx];
  },
  delete(id) {
    const products = this.getAll().filter(p => p.id !== id);
    writeJSON(DB_KEYS.PRODUCTS, products);
  },
  decrementStock(id, qty) {
    const product = this.getById(id);
    if (!product) return;
    const newStock = Math.max(0, product.stock - qty);
    this.update(id, { stock: newStock });
  }
};

/* ---------- Cart (per user) ---------- */
const CartDB = {
  _all() {
    return readJSON(DB_KEYS.CART, {});
  },
  _saveAll(all) {
    writeJSON(DB_KEYS.CART, all);
  },
  getCart(userId) {
    const all = this._all();
    return all[userId] || [];
  },
  saveCart(userId, items) {
    const all = this._all();
    all[userId] = items;
    this._saveAll(all);
  },
  addItem(userId, productId, qty = 1) {
    const items = this.getCart(userId);
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ productId, qty });
    }
    this.saveCart(userId, items);
    return items;
  },
  updateQty(userId, productId, qty) {
    let items = this.getCart(userId);
    if (qty <= 0) {
      items = items.filter(i => i.productId !== productId);
    } else {
      const existing = items.find(i => i.productId === productId);
      if (existing) existing.qty = qty;
    }
    this.saveCart(userId, items);
    return items;
  },
  removeItem(userId, productId) {
    const items = this.getCart(userId).filter(i => i.productId !== productId);
    this.saveCart(userId, items);
    return items;
  },
  clearCart(userId) {
    this.saveCart(userId, []);
  }
};

/* ---------- Orders ---------- */
const OrderDB = {
  getAll() {
    return readJSON(DB_KEYS.ORDERS, []);
  },
  getByUser(userId) {
    return this.getAll().filter(o => o.userId === userId);
  },
  create(order) {
    const orders = this.getAll();
    const newOrder = {
      id: genId('order'),
      createdAt: new Date().toISOString(),
      status: 'paid',
      ...order
    };
    orders.push(newOrder);
    writeJSON(DB_KEYS.ORDERS, orders);
    return newOrder;
  }
};

/* ---------- Session ---------- */
const SessionDB = {
  getCurrentUser() {
    const session = readJSON(DB_KEYS.SESSION, null);
    if (!session) return null;
    const user = UserDB.getAll().find(u => u.id === session.userId);
    return user || null;
  },
  login(user) {
    writeJSON(DB_KEYS.SESSION, { userId: user.id });
  },
  logout() {
    localStorage.removeItem(DB_KEYS.SESSION);
  }
};

/* ---------- Wishlist ---------- */
const WishlistDB = {
  getAllWishlists() {
    return readJSON(DB_KEYS.WISHLIST, {});
  },
  getWishlist(userId) {
    const lists = this.getAllWishlists();
    return lists[userId] || [];
  },
  toggle(userId, productId) {
    const lists = this.getAllWishlists();
    const list = lists[userId] || [];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }
    lists[userId] = list;
    writeJSON(DB_KEYS.WISHLIST, lists);
    return list;
  }
};
