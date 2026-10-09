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

function renderMobileNavbar(user) {
  const mobileAuthArea = document.getElementById('mobileAuthArea');
  if (!mobileAuthArea) return;

  if (!user) {
    mobileAuthArea.innerHTML = `
      <a href="login.html" style="display:block; margin-bottom:12px; font-weight:600; color:var(--color-text);">Masuk</a>
      <a href="register.html" style="display:block; font-weight:600; color:var(--color-primary);">Daftar</a>
    `;
  } else {
    let menuItems = '';
    if (user.role === 'admin') {
      menuItems += `<a href="admin.html" style="display:block; margin-bottom:12px; font-weight:600; color:var(--color-text);">Dasbor Admin</a>`;
    } else {
      menuItems += `
        <a href="account.html" style="display:block; margin-bottom:12px; font-weight:600; color:var(--color-text);">Akun Saya</a>
        <a href="account.html#orders-sec" style="display:block; margin-bottom:12px; font-weight:600; color:var(--color-text);">Riwayat Pesanan</a>
        <a href="account.html#wishlist-sec" style="display:block; margin-bottom:12px; font-weight:600; color:var(--color-text);">Wishlist</a>
      `;
    }

    mobileAuthArea.innerHTML = `
      <div style="font-weight:700; color:var(--color-text); margin-bottom:12px;">Halo, ${escapeHTML(user.name)}</div>
      ${menuItems}
      <button id="mobileLogoutBtn" style="background:none; border:none; padding:0; font-weight:600; color:var(--color-danger); cursor:pointer;">Keluar</button>
    `;
    
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', logoutUser);
    }
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
    const initials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    
    let menuItems = '';
    if (user.role === 'admin') {
      menuItems += `<a href="admin.html" class="dropdown-item">Dasbor Admin</a>`;
    } else {
      menuItems += `
        <a href="account.html" class="dropdown-item">Akun Saya</a>
        <a href="account.html#orders-sec" class="dropdown-item">Riwayat Pesanan</a>
        <a href="account.html#wishlist-sec" class="dropdown-item">Wishlist</a>
      `;
    }

    authArea.innerHTML = `
      <div class="account-dropdown-wrap">
        <button class="account-dropdown-btn" id="accountDropdownBtn" aria-expanded="false" aria-haspopup="true">
          <div class="account-avatar">${initials}</div>
          <span>${escapeHTML(user.name.split(' ')[0])}</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="account-dropdown-menu" id="accountDropdownMenu" role="menu">
          <div class="dropdown-header">
            <div class="dropdown-name">${escapeHTML(user.name)}</div>
            <div class="dropdown-email">${escapeHTML(user.email)}</div>
          </div>
          ${menuItems}
          <button id="logoutBtn" class="dropdown-item text-danger" role="menuitem" style="width: 100%; text-align: left; background: none; border: none; cursor: pointer;">
            Keluar
          </button>
        </div>
      </div>
    `;

    const dropdownBtn = document.getElementById('accountDropdownBtn');
    const dropdownMenu = document.getElementById('accountDropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (dropdownBtn && dropdownMenu) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = dropdownBtn.getAttribute('aria-expanded') === 'true';
        dropdownBtn.setAttribute('aria-expanded', !isExpanded);
        dropdownMenu.classList.toggle('show');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownBtn.setAttribute('aria-expanded', 'false');
          dropdownMenu.classList.remove('show');
        }
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdownBtn.setAttribute('aria-expanded', 'false');
          dropdownMenu.classList.remove('show');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutUser);
    }
  }

  renderMobileNavbar(user);
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
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
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
