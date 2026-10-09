/* =========================================================
   store.js — storefront page logic (index.html)
   Redesigned for TokoKu with modern aesthetics & full functionality
   ========================================================= */

let allProducts = [];
let currentFilters = { search: '', category: '', sort: 'default', wishlistOnly: false };

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  allProducts = ProductDB.getAll();
  populateCategoryFilter();
  setupCategoryCards();
  setupSearchSync();
  setupMobileMenu();
  setupWishlistNav();
  renderProducts();

  // Search input in filter bar
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      syncSearchInputs(e.target.value);
      renderProducts();
    });
  }

  // Category filter dropdown
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      updateActiveCategoryCard(e.target.value);
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      renderProducts();
    });
  }

  // "View All Products" button
  const viewAllBtn = document.getElementById('viewAllProductsBtn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilters();
      scrollToSection('products-section');
    });
  }

  // "View All Categories" button
  const viewAllCatBtn = document.getElementById('viewAllCategoriesBtn');
  if (viewAllCatBtn) {
    viewAllCatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetFilters();
      scrollToSection('products-section');
    });
  }
});

function resetFilters() {
  currentFilters = { search: '', category: '', sort: 'default', wishlistOnly: false };
  const searchInput = document.getElementById('searchInput');
  const navSearch = document.getElementById('navSearchInput');
  const catFilter = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortSelect');

  if (searchInput) searchInput.value = '';
  if (navSearch) navSearch.value = '';
  if (catFilter) catFilter.value = '';
  if (sortSelect) sortSelect.value = 'default';

  updateActiveCategoryCard('');
  renderProducts();
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function syncSearchInputs(val) {
  const navSearch = document.getElementById('navSearchInput');
  const searchInput = document.getElementById('searchInput');
  if (navSearch && navSearch.value !== val) navSearch.value = val;
  if (searchInput && searchInput.value !== val) searchInput.value = val;
}

function setupSearchSync() {
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch) {
    navSearch.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.trim().toLowerCase();
      syncSearchInputs(e.target.value);
      renderProducts();
      if (window.scrollY < 400 && e.target.value) {
        scrollToSection('products-section');
      }
    });

    navSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        scrollToSection('products-section');
      }
    });
  }
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const closeBtn = document.getElementById('mobileMenuClose');
  const drawer = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');

  if (!toggleBtn || !drawer) return;

  const openMenu = () => {
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

function setupWishlistNav() {
  const wishlistNavBtn = document.getElementById('navWishlistBtn');
  if (wishlistNavBtn) {
    wishlistNavBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilters.wishlistOnly = !currentFilters.wishlistOnly;
      wishlistNavBtn.classList.toggle('active', currentFilters.wishlistOnly);
      if (currentFilters.wishlistOnly) {
        showToast('Menampilkan produk di Wishlist kamu');
      }
      renderProducts();
      scrollToSection('products-section');
    });
  }
}

function populateCategoryFilter() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
  select.innerHTML = '<option value="">Semua Kategori</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function setupCategoryCards() {
  const cards = document.querySelectorAll('[data-category-target]');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const targetCat = card.dataset.categoryTarget;
      if (currentFilters.category === targetCat) {
        // Toggle off if already active
        currentFilters.category = '';
      } else {
        currentFilters.category = targetCat;
      }

      const select = document.getElementById('categoryFilter');
      if (select) select.value = currentFilters.category;

      updateActiveCategoryCard(currentFilters.category);
      renderProducts();
      scrollToSection('products-section');
    });
  });
}

function updateActiveCategoryCard(categoryName) {
  const cards = document.querySelectorAll('[data-category-target]');
  cards.forEach(card => {
    if (card.dataset.categoryTarget === categoryName && categoryName !== '') {
      card.classList.add('category-card-active');
    } else {
      card.classList.remove('category-card-active');
    }
  });
}

function getProductRating(p) {
  const hash = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.6 + (hash % 4) * 0.1).toFixed(1);
  const reviews = 36 + (hash % 115);
  return { rating, reviews };
}

function getFilteredProducts() {
  let list = [...allProducts];

  if (currentFilters.search) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(currentFilters.search) ||
      (p.description || '').toLowerCase().includes(currentFilters.search) ||
      (p.category || '').toLowerCase().includes(currentFilters.search)
    );
  }

  if (currentFilters.category) {
    list = list.filter(p => p.category === currentFilters.category);
  }

  if (currentFilters.wishlistOnly && typeof WishlistDB !== 'undefined') {
    const user = SessionDB.getCurrentUser();
    if (user) {
      const wishlistedIds = WishlistDB.getWishlist(user.id);
      list = list.filter(p => wishlistedIds.includes(p.id));
    } else {
      list = []; // not logged in, no wishlist
    }
  }

  switch (currentFilters.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break;
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid || !emptyState) return;

  const filtered = getFilteredProducts();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(p => productCardHTML(p)).join('');

  grid.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => handleAddToCart(btn.dataset.addToCart));
  });

  grid.querySelectorAll('[data-buy-now]').forEach(btn => {
    btn.addEventListener('click', () => handleBuyNow(btn.dataset.buyNow));
  });

  grid.querySelectorAll('[data-wishlist]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToggleWishlist(btn.dataset.wishlist, btn);
    });
  });
}

function productCardHTML(p) {
  let stockLabel, stockClass;
  if (p.stock <= 0) { stockLabel = 'Stok habis'; stockClass = 'stock-out'; }
  else if (p.stock <= 5) { stockLabel = `Tersisa ${p.stock}`; stockClass = 'stock-low'; }
  else { stockLabel = 'Tersedia'; stockClass = 'stock-ok'; }

  const user = SessionDB.getCurrentUser();
  const isWishlisted = typeof WishlistDB !== 'undefined' && user && WishlistDB.getWishlist(user.id).includes(p.id);
  const { rating, reviews } = getProductRating(p);

  return `
    <div class="product-card" data-product-id="${p.id}">
      <div class="product-thumb-wrap">
        <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" 
                data-wishlist="${p.id}" 
                aria-label="Tambah ke Wishlist" 
                title="${isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="${isWishlisted ? '#D9534F' : 'none'}" stroke="${isWishlisted ? '#D9534F' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <img class="product-thumb" src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x300?text=Gambar+Tidak+Tersedia'">
        <span class="stock-pill ${stockClass}">${stockLabel}</span>
      </div>
      <div class="product-card-body">
        <span class="product-category">${escapeHTML(p.category || 'Umum')}</span>
        <h3 class="product-name" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</h3>
        
        <div class="product-rating">
          <span class="rating-star">★</span>
          <span class="rating-score">${rating}</span>
          <span class="rating-count">(${reviews})</span>
        </div>

        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
        </div>

        <div class="product-btn-group">
          <button class="btn btn-primary btn-add-cart"
            data-add-to-cart="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            ${p.stock <= 0 ? 'Stok Habis' : 'Add to Cart'}
          </button>
          <button class="btn btn-secondary btn-buy-now"
            data-buy-now="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
            Beli
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleToggleWishlist(productId, btn) {
  if (typeof WishlistDB === 'undefined') return;
  const user = SessionDB.getCurrentUser();
  if (!user) {
    showToast('Silakan login untuk menggunakan wishlist.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 900);
    return;
  }
  
  const wishlist = WishlistDB.toggle(user.id, productId);
  const added = wishlist.includes(productId);
  
  btn.classList.toggle('active', added);
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', added ? '#D9534F' : 'none');
    svg.setAttribute('stroke', added ? '#D9534F' : 'currentColor');
  }
  btn.setAttribute('title', added ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist');
  updateWishlistBadge();
  showToast(added ? 'Produk ditambahkan ke Wishlist' : 'Produk dihapus dari Wishlist');

  if (currentFilters.wishlistOnly && !added) {
    renderProducts();
  }
}

function handleAddToCart(productId) {
  const user = SessionDB.getCurrentUser();
  if (!user) {
    showToast('Masuk terlebih dahulu untuk menambahkan produk ke keranjang.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 900);
    return;
  }

  const product = ProductDB.getById(productId);
  if (!product || product.stock <= 0) {
    showToast('Produk ini sedang habis.', 'error');
    return;
  }

  CartDB.addItem(user.id, productId, 1);
  updateCartBadge();
  showToast(`${product.name} ditambahkan ke keranjang.`);
}

function handleBuyNow(productId) {
  const product = ProductDB.getById(productId);
  if (!product || product.stock <= 0) {
    showToast('Produk sedang habis.', 'error');
    return;
  }

  sessionStorage.setItem('checkoutProductId', productId);
  const user = SessionDB.getCurrentUser();
  window.location.href = user ? 'checkout.html' : 'login.html?next=checkout';
}
