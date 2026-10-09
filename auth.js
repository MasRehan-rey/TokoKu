/* =========================================================
   auth.js — shared auth helpers, route guards, navbar rendering
   ========================================================= */

function requireLogin(redirectTo = 'login.html') {
  const user = SessionDB.getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

function requireAdmin(redirectTo = 'index.html') {
  const user = SessionDB.getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

function redirectIfLoggedIn(target = 'index.html') {
  const user = SessionDB.getCurrentUser();
  if (user) {
    window.location.href = target;
  }
}

function logoutUser() {
  SessionDB.logout();
  window.location.href = 'index.html';
}

/* Renders the shared navbar auth area (#authArea) based on session state.
   Expects an element with id="authArea" and id="cartCount" (optional) on the page. */
function renderNavbar() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  const user = SessionDB.getCurrentUser();

  if (!user) {
    authArea.innerHTML = `
      <a href="login.html" class="nav-link">Masuk</a>
      <a href="register.html" class="nav-link btn-outline-small">Daftar</a>
    `;
  } else {
    const adminLink = user.role === 'admin'
      ? `<a href="admin.html" class="nav-link">Panel Admin</a>`
      : '';
    authArea.innerHTML = `
      ${adminLink}
      <a href="account.html" class="nav-link nav-greeting">Halo, ${escapeHTML(user.name)}</a>
      <button id="logoutBtn" class="nav-link btn-outline-small">Keluar</button>
    `;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutUser);
    }
  }

  updateCartBadge();
  updateWishlistBadge();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistCount');
  if (!badge) return;
  const user = SessionDB.getCurrentUser();
  const count = (typeof WishlistDB !== 'undefined' && user) ? WishlistDB.getWishlist(user.id).length : 0;
  badge.textContent = String(count);
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const user = SessionDB.getCurrentUser();
  if (!user) {
    badge.textContent = '0';
    badge.style.display = 'none';
    return;
  }
  const items = CartDB.getCart(user.id);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  badge.textContent = String(totalQty);
  badge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
}

/* basic HTML escaping to avoid accidental injection from stored text fields */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(num) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num * 15000);
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('toast-hide'), 2200);
  setTimeout(() => toast.remove(), 2600);
}
