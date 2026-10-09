/* =========================================================
   account.js — user profile, order history, wishlist
   ========================================================= */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireLogin('login.html');
  if (!currentUser) return;

  renderNavbar();
  setupTabs();
  prefillProfile();
  loadOrders();
  loadWishlist();

  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
});

function setupTabs() {
  const tabs = document.querySelectorAll('.account-nav-item[data-target]');
  const sections = document.querySelectorAll('.account-content-section');

  const activateTab = (targetId) => {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));

    const activeTab = Array.from(tabs).find(t => t.getAttribute('data-target') === targetId) || tabs[0];
    const targetSectionId = activeTab.getAttribute('data-target');
    
    activeTab.classList.add('active');
    document.getElementById(targetSectionId).classList.add('active');
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activateTab(tab.getAttribute('data-target'));
      window.history.pushState(null, '', '#' + tab.getAttribute('data-target'));
    });
  });

  // Handle initial load based on hash
  if (window.location.hash) {
    const hashTarget = window.location.hash.substring(1);
    activateTab(hashTarget);
  }
}

function prefillProfile() {
  document.getElementById('profName').value = currentUser.name || '';
  document.getElementById('profEmail').value = currentUser.email || '';
  document.getElementById('profPhone').value = currentUser.phone || '';
}

function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('profName').value.trim();
  const phone = document.getElementById('profPhone').value.trim();
  const newPass = document.getElementById('profNewPass').value;
  const errorBox = document.getElementById('profileError');
  const successBox = document.getElementById('profileSuccess');

  errorBox.classList.remove('show');
  successBox.style.display = 'none';

  if (!name) {
    errorBox.textContent = 'Nama tidak boleh kosong.';
    errorBox.classList.add('show');
    return;
  }

  const updates = { name, phone };
  if (newPass) {
    if (newPass.length < 6) {
      errorBox.textContent = 'Kata sandi baru minimal 6 karakter.';
      errorBox.classList.add('show');
      return;
    }
    updates.password = simpleHash(newPass);
  }

  // Update in UserDB
  const users = readJSON(DB_KEYS.USERS, []);
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    writeJSON(DB_KEYS.USERS, users);
    
    // Update session
    SessionDB.login(users[idx]);
    currentUser = users[idx];
    
    document.getElementById('profNewPass').value = '';
    successBox.style.display = 'block';
    renderNavbar(); // update name in navbar
  }
}

function loadOrders() {
  const container = document.getElementById('ordersContainer');
  const allOrders = OrderDB.getAll().filter(o => o.userId === currentUser.id);

  if (allOrders.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Belum ada riwayat pesanan.</p><a href="index.html" class="btn btn-primary" style="margin-top:1rem;">Mulai Belanja</a></div>';
    return;
  }

  allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = allOrders.map(order => {
    const itemsHtml = order.items.map(i => `
      <div class="order-item">
        <span>${escapeHTML(i.name)} × ${i.qty}</span>
        <span>
          ${formatPrice(i.price * i.qty)}
          ${order.status === 'Selesai' ? `<button class="btn btn-outline-small" style="margin-left:8px; font-size:0.7rem; padding:2px 6px;" onclick="simulateReview('${i.productId}')">Ulas</button>` : ''}
        </span>
      </div>
    `).join('');

    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <strong>ID Pesanan: ${order.id}</strong><br>
            ${new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div>
            <span class="status-badge">${escapeHTML(order.status || 'Selesai')}</span>
          </div>
        </div>
        ${itemsHtml}
        <div style="border-top:1px dashed var(--border-color); margin-top:0.5rem; padding-top:0.5rem; text-align:right;">
          <small>Pembayaran: ${escapeHTML(order.paymentMethod || 'Credit Card')}</small><br>
          <strong>Total: ${formatPrice(order.total)}</strong>
        </div>
      </div>
    `;
  }).join('');
}

function loadWishlist() {
  const container = document.getElementById('wishlistContainer');
  const emptyState = document.getElementById('wishlistEmpty');
  const wishlist = WishlistDB ? WishlistDB.getWishlist(currentUser.id) : [];

  if (wishlist.length === 0) {
    emptyState.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  const products = ProductDB.getAll();
  const wishProducts = wishlist.map(w => products.find(p => p.id === w)).filter(Boolean);

  container.innerHTML = wishProducts.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" class="product-img" onerror="this.src='https://via.placeholder.com/400x400?text=Gambar+Tidak+Tersedia'">
      </div>
      <div class="product-info">
        <div class="product-category">${escapeHTML(p.category)}</div>
        <h3 class="product-title">${escapeHTML(p.name)}</h3>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="btn btn-primary btn-block" onclick="wishlistAddToCart('${p.id}')">Add to Cart</button>
          <button class="btn btn-outline-small btn-block" onclick="removeFromWishlist('${p.id}')">Hapus</button>
        </div>
      </div>
    </div>
  `).join('');
}

function wishlistAddToCart(productId) {
  const user = SessionDB.getCurrentUser();
  if (!user) return;
  const product = ProductDB.getById(productId);
  if (!product || product.stock <= 0) {
    showToast('Produk sedang habis.', 'error');
    return;
  }
  CartDB.addItem(user.id, productId, 1);
  if (typeof updateCartBadge === 'function') updateCartBadge();
  showToast(`${product.name} ditambahkan ke keranjang.`);
}

function removeFromWishlist(productId) {
  if (WishlistDB) {
    WishlistDB.toggle(currentUser.id, productId);
    loadWishlist();
    if (typeof updateWishlistBadge === 'function') updateWishlistBadge();
  }
}

function simulateReview(productId) {
  const rating = prompt('Berikan rating bintang (1-5):', '5');
  if (rating === null) return;
  const review = prompt('Tulis ulasan Anda:');
  if (review === null) return;
  
  if (parseInt(rating) >= 1 && parseInt(rating) <= 5) {
    alert('Terima kasih! Ulasan demo Anda telah berhasil disimpan.');
  } else {
    alert('Rating tidak valid.');
  }
}
