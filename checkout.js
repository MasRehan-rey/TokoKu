/* =========================================================
   checkout.js — checkout page logic (checkout.html)
   ========================================================= */

const CHK_TAX_RATE = 0.08;
const CHK_FLAT_SHIPPING = 25000;
const CHK_FREE_SHIPPING_THRESHOLD = 500000;

let checkoutUser = null;
let checkoutItems = [];
let appliedVoucher = null;

document.addEventListener('DOMContentLoaded', () => {
  checkoutUser = requireLogin('login.html');
  if (!checkoutUser) return;

  renderNavbar();

  let directProductId = sessionStorage.getItem('checkoutProductId');
  if (directProductId) {
    const product = ProductDB.getById(directProductId);
    if (product && product.stock > 0) {
      checkoutItems = [{ productId: product.id, qty: 1, product }];
    } else {
      sessionStorage.removeItem('checkoutProductId');
      directProductId = null;
    }
  }

  if (checkoutItems.length === 0) {
    checkoutItems = CartDB.getCart(checkoutUser.id)
      .map(item => {
        const product = ProductDB.getById(item.productId);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean);
  }

  if (checkoutItems.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // prefill name from account
  document.getElementById('fullName').value = checkoutUser.name || '';
  
  // prefill phone if available (mock from user.phone if it exists)
  if (checkoutUser.phone) document.getElementById('phone').value = checkoutUser.phone;

  renderMiniOrder();
  renderSummary();

  const applyVoucherBtn = document.getElementById('applyVoucherBtn');
  if (applyVoucherBtn) {
    applyVoucherBtn.addEventListener('click', applyVoucher);
  }

  document.getElementById('checkoutForm').addEventListener('submit', handlePlaceOrder);
});

function renderMiniOrder() {
  const el = document.getElementById('miniOrderItems');
  el.innerHTML = checkoutItems.map(({ product, qty }) => `
    <div class="mini-order-item">
      <span>${escapeHTML(product.name)} × ${qty}</span>
      <span>${formatPrice(product.price * qty)}</span>
    </div>
  `).join('');
}

function calcTotals() {
  const subtotal = checkoutItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  let discount = 0;
  
  if (appliedVoucher) {
    if (appliedVoucher.type === 'percent') {
      discount = subtotal * (appliedVoucher.value / 100);
      if (appliedVoucher.maxDiscount && discount > appliedVoucher.maxDiscount) {
        discount = appliedVoucher.maxDiscount;
      }
    } else if (appliedVoucher.type === 'fixed') {
      discount = appliedVoucher.value;
    }
  }
  
  // Prevent subtotal - discount from being negative
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  const tax = subtotalAfterDiscount * CHK_TAX_RATE;
  const shipping = subtotalAfterDiscount >= CHK_FREE_SHIPPING_THRESHOLD ? 0 : CHK_FLAT_SHIPPING;
  const total = subtotalAfterDiscount + tax + shipping;
  return { subtotal, discount, tax, shipping, total };
}

function renderSummary() {
  const { subtotal, discount, tax, shipping, total } = calcTotals();
  
  let summaryHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
  `;
  
  if (discount > 0) {
    summaryHTML += `<div class="summary-row" style="color:var(--primary);"><span>Diskon (${appliedVoucher.code})</span><span>-${formatPrice(discount)}</span></div>`;
  }
  
  summaryHTML += `
    <div class="summary-row"><span>Pajak (8%)</span><span id="sumTax">${formatPrice(tax)}</span></div>
    <div class="summary-row"><span>Ongkos Kirim</span><span id="sumShipping">${shipping === 0 ? 'GRATIS' : formatPrice(shipping)}</span></div>
    <div class="summary-row total"><span>Total Akhir</span><span id="sumTotal">${formatPrice(total)}</span></div>
  `;
  
  // Assuming the summary container is fixed
  const summaryContainer = document.querySelector('.summary-card');
  if (summaryContainer) {
    // We update inner HTML of summary
    const placeOrderHtml = `<button type="submit" id="placeOrderBtn" class="btn btn-primary btn-block" form="checkoutForm" style="margin-top:16px;">Konfirmasi Pesanan</button>`;
    summaryContainer.innerHTML = `<h3>Ringkasan Pesanan</h3>${summaryHTML}${placeOrderHtml}`;
  }
}

function applyVoucher() {
  const code = document.getElementById('voucherCode').value.trim().toUpperCase();
  const msgEl = document.getElementById('voucherMessage');
  const { subtotal } = calcTotals();
  
  if (!code) {
    msgEl.textContent = 'Masukkan kode voucher terlebih dahulu.';
    msgEl.style.color = 'var(--danger)';
    return;
  }
  
  // Dummy voucher list
  const validVouchers = {
    'HEMAT10': { code: 'HEMAT10', type: 'percent', value: 10, minPurchase: 50, maxDiscount: 20 },
    'DISKON20': { code: 'DISKON20', type: 'fixed', value: 20, minPurchase: 100 }
  };
  
  const voucher = validVouchers[code];
  if (!voucher) {
    msgEl.textContent = 'Kode voucher tidak valid atau sudah kadaluarsa.';
    msgEl.style.color = 'var(--danger)';
    appliedVoucher = null;
  } else if (subtotal < voucher.minPurchase) {
    msgEl.textContent = `Minimal belanja ${formatPrice(voucher.minPurchase)} untuk menggunakan voucher ini.`;
    msgEl.style.color = 'var(--danger)';
    appliedVoucher = null;
  } else {
    appliedVoucher = voucher;
    msgEl.textContent = 'Voucher berhasil diterapkan!';
    msgEl.style.color = 'var(--success)';
  }
  
  renderSummary();
}

function validatePayment() {
  const method = document.getElementById('paymentMethod').value;
  if (!method) {
    const errorBox = document.getElementById('paymentError');
    errorBox.textContent = 'Pilih metode pembayaran simulasi.';
    errorBox.classList.add('show');
    return false;
  }
  return true;
}

function handlePlaceOrder(e) {
  e.preventDefault();

  // re-check stock right before placing the order in case it changed
  for (const item of checkoutItems) {
    const liveProduct = ProductDB.getById(item.product.id);
    if (!liveProduct || liveProduct.stock < item.qty) {
      showToast(`Stok ${item.product.name} tidak mencukupi.`, 'error');
      return;
    }
  }

  if (!validatePayment()) return;

  const placeOrderBtn = document.getElementById('placeOrderBtn');
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Memproses...';

  // simulate a payment processing delay
  setTimeout(() => {
    const { subtotal, discount, tax, shipping, total } = calcTotals();

    const shipping_info = {
      fullName: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      zip: document.getElementById('zip').value.trim(),
      country: document.getElementById('country').value.trim()
    };

    const orderItems = checkoutItems.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      price: i.product.price,
      qty: i.qty
    }));

    const methodEl = document.getElementById('paymentMethod');
    const paymentMethodLabel = methodEl.options[methodEl.selectedIndex].text;

    const order = OrderDB.create({
      userId: checkoutUser.id,
      items: orderItems,
      subtotal,
      discount,
      voucherCode: appliedVoucher ? appliedVoucher.code : null,
      tax,
      shipping,
      total,
      shippingInfo: shipping_info,
      paymentMethod: paymentMethodLabel,
      status: 'Menunggu Pembayaran'
    });

    // decrement stock for each purchased product
    orderItems.forEach(i => ProductDB.decrementStock(i.productId, i.qty));

    // clear the user's cart
    if (directProductId) {
      sessionStorage.removeItem('checkoutProductId');
    } else {
      CartDB.clearCart(checkoutUser.id);
    }

    // stash last order id for confirmation page
    sessionStorage.setItem('lastOrderId', order.id);

    window.location.href = 'order-confirmation.html';
  }, 900);
}
