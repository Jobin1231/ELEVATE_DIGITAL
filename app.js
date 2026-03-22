// app.js

// ==== STATE MANAGEMENT ====
let cart = [];

// ==== RAZORPAY PAYMENT PAGE LINKS ====
// After creating your Razorpay account, replace each '#' below with your actual payment page URL
// Example: https://pages.razorpay.com/elevate-guide1
const paymentLinks = {
  1: 'https://rzp.io/rzp/4JiKxpBH',
  2: 'https://pages.razorpay.com/YOUR-LINK-FOR-GUIDE-2',
  3: 'https://pages.razorpay.com/YOUR-LINK-FOR-GUIDE-3',
  4: 'https://pages.razorpay.com/YOUR-LINK-FOR-GUIDE-4',
  5: 'https://pages.razorpay.com/YOUR-LINK-FOR-GUIDE-5',
  6: 'https://pages.razorpay.com/YOUR-LINK-FOR-BUNDLE'
};

// Mock Products Database
const products = [
  { id: 1, title: 'Freelancing & Digital Products', price: 199, oldPrice: 299, cat: 'freelance', rating: 4.9, reviews: 124, tag: null },
  { id: 2, title: 'Dropshipping for Indians', price: 199, oldPrice: 299, cat: 'dropship', rating: 4.8, reviews: 98, tag: 'New' },
  { id: 3, title: 'Stock & Crypto Basics', price: 199, oldPrice: 299, cat: 'trading', rating: 4.9, reviews: 156, tag: null },
  { id: 4, title: 'Earning with AI Tools', price: 199, oldPrice: 299, cat: 'ai', rating: 5.0, reviews: 210, tag: 'Hot' },
  { id: 5, title: 'Create & Sell Your Own Guide', price: 199, oldPrice: 299, cat: 'digital', rating: 4.8, reviews: 85, tag: null },
  { id: 6, title: 'Complete Earn Online Bundle', price: 499, oldPrice: 995, cat: 'bundle', rating: 5.0, reviews: 342, tag: 'Bestseller' }
];

// ==== DOM ELEMENTS ====
const navbar = document.querySelector('header');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.nav-links');
const toastBtn = document.getElementById('toast');
const cartBadge = document.querySelector('.cart-badge');
const cartContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// ==== INITIALIZATION ====
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initStickyNav();
  initCountdown();
  initFAQ();
  initStoreFilters();
  initAnimations();
  checkModal();

  // Mobile Menu
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });

  // Global Click listener for add to cart
  document.addEventListener('click', (e) => {
    if (e.target.closest('.add-to-cart-btn')) {
      const id = parseInt(e.target.closest('.add-to-cart-btn').dataset.id);
      addToCart(id);
    }
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }

      // If only one item in cart, go directly to that product's payment page
      if (cart.length === 1) {
        const link = paymentLinks[cart[0].id];
        if (link) {
          window.open(link, '_blank');
        } else {
          alert('Payment link not set up yet. Please update your Razorpay payment links in app.js.');
        }
        return;
      }

      // If multiple items, send to bundle payment page or first item's page
      // Customer selects the right items on the Razorpay page
      const bundleLink = paymentLinks[6];
      if (bundleLink) {
        window.open(bundleLink, '_blank');
      } else {
        alert('Payment link not set up yet. Please update your Razorpay payment links in app.js.');
      }
    });
  }
});

// ==== SPA ROUTING ====
function initRouter() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');

      if (targetId === 'page-detail') {
        const idEl = link.closest('.product-card')?.querySelector('.add-to-cart-btn');
        if (idEl) {
          loadProductDetail(parseInt(idEl.getAttribute('data-id')));
        }
      }

      navigateTo(targetId);

      // Close mobile menu on click
      mobileMenu.classList.remove('active');

      // Update active nav state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // initial load
  navigateTo('page-home');
}

function navigateTo(pageId) {
  pages.forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    initAnimations(); // re-trigger animations
  }
}

function loadProductDetail(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const getCatName = (cat) => {
    const map = { bundle: 'Bundle Deal', freelance: 'Freelance', dropship: 'Dropship', trading: 'Trading', ai: 'AI Tools', digital: 'Digital' };
    return map[cat] || 'Guide';
  };

  const getCatColor = (cat) => {
    const map = { bundle: '#e0a800', freelance: '#3b82f6', dropship: '#f97316', trading: '#10b981', ai: '#8b5cf6', digital: '#eab308' };
    return map[cat] || 'var(--highlight)';
  };

  const detailBadge = document.getElementById('detail-badge');
  if (detailBadge) {
    detailBadge.innerText = getCatName(product.cat);
    detailBadge.style.background = getCatColor(product.cat);
    if (product.cat === 'digital') detailBadge.style.color = '#000';
    else detailBadge.style.color = '#fff';
  }

  if (document.getElementById('detail-title')) document.getElementById('detail-title').innerText = product.title;
  if (document.getElementById('detail-reviews')) document.getElementById('detail-reviews').innerText = `${product.rating} (${product.reviews} Reviews)`;

  const detailCover = document.getElementById('detail-cover');
  if (detailCover) {
    const coverMap = {
      1: 'assets/cover_freelance.png',
      2: 'assets/cover_dropship.png',
      3: 'assets/cover_trading.png',
      4: 'assets/cover_ai.png',
      5: 'assets/cover_digital.png',
      6: 'assets/cover_bundle.png'
    };
    detailCover.src = coverMap[product.id] || 'assets/cover_bundle.png';
  }

  if (document.getElementById('detail-desc')) {
    let desc = 'This comprehensive guide brings you the exact, step-by-step blueprints to start generating income online in India through proven methods.';
    if (product.id === 6) desc = 'Stop wasting time on YouTube tutorials that lead nowhere. This comprehensive 5-guide bundle gives you the exact, step-by-step blueprints to start generating income online in India through 5 proven methods.';
    document.getElementById('detail-desc').innerText = desc;
  }

  if (document.getElementById('detail-oldprice')) document.getElementById('detail-oldprice').innerText = `₹${product.oldPrice}`;
  if (document.getElementById('detail-price')) document.getElementById('detail-price').innerText = `₹${product.price}`;

  if (document.getElementById('detail-savings')) {
    const savings = product.oldPrice - product.price;
    document.getElementById('detail-savings').innerText = `🔥 YOU SAVE ₹${savings}!`;
  }

  const addBtn = document.getElementById('detail-add-btn');
  if (addBtn) {
    addBtn.setAttribute('data-id', product.id);
    addBtn.innerText = `Add to Cart — ₹${product.price}`;
  }
}

// ==== STICKY NAV ====
function initStickyNav() {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ==== COUNTDOWN TIMER ====
function initCountdown() {
  const hoursEl = document.getElementById('time-hours');
  const minsEl = document.getElementById('time-mins');
  const secsEl = document.getElementById('time-secs');

  if (!hoursEl) return;

  // Check localStorage for expiry time
  let expiryTime = localStorage.getItem('earnSmartBundleExpiry');
  const now = new Date().getTime();

  if (!expiryTime || now > parseInt(expiryTime)) {
    // Set 24 hours from now
    expiryTime = now + (24 * 60 * 60 * 1000);
    localStorage.setItem('earnSmartBundleExpiry', expiryTime);
  }

  setInterval(() => {
    const currentTime = new Date().getTime();
    let distance = parseInt(expiryTime) - currentTime;

    if (distance < 0) {
      // Reset timer
      expiryTime = currentTime + (24 * 60 * 60 * 1000);
      localStorage.setItem('earnSmartBundleExpiry', expiryTime);
      distance = parseInt(expiryTime) - currentTime;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    hoursEl.innerText = hours.toString().padStart(2, '0');
    minsEl.innerText = minutes.toString().padStart(2, '0');
    secsEl.innerText = seconds.toString().padStart(2, '0');
  }, 1000);
}

// ==== CART FUNCTIONALITY ====
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  renderCart();
  showToast(`Added ${product.title} to Cart!`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.innerText = count;
}

function renderCart() {
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="color:var(--muted); padding: 1.5rem 0;">Your cart is empty.</p>';
    if (cartTotal) cartTotal.innerText = '₹0';
    return;
  }

  cartContainer.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.price * item.qty;
    const getCoverImage = (id) => {
      const coverMap = {
        1: 'assets/cover_freelance.png',
        2: 'assets/cover_dropship.png',
        3: 'assets/cover_trading.png',
        4: 'assets/cover_ai.png',
        5: 'assets/cover_digital.png',
        6: 'assets/cover_bundle.png'
      };
      return coverMap[id] || 'assets/cover_bundle.png';
    };

    cartContainer.innerHTML += `
      <div class="cart-item">
        <img src="${getCoverImage(item.id)}" style="width:60px; height:80px; object-fit:cover; border-radius:4px; margin-right:1rem;" alt="Cover">
        <div style="flex-grow:1;">
          <h4 style="font-family:var(--font-body); font-size:1rem; margin-bottom:0.25rem;">${item.title}</h4>
          <div style="color:var(--muted); font-size:0.9rem;">Qty: ${item.qty}</div>
          <div style="font-weight:700; color:var(--text); margin-top:0.5rem;">₹${item.price}</div>
        </div>
        <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.2rem;">&times;</button>
      </div>
    `;
  });

  if (cartTotal) cartTotal.innerText = `₹${subtotal}`;
}

// ==== NOTIFICATIONS ====
function showToast(msg) {
  toastBtn.innerText = msg;
  toastBtn.classList.add('show');
  setTimeout(() => {
    toastBtn.classList.remove('show');
  }, 3000);
}

// ==== FAQ ACCORDION ====
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      // close others
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });
      item.classList.toggle('active');
    });
  });
}

// ==== STORE FILTERS ====
function initStoreFilters() {
  const catBtns = document.querySelectorAll('.cat-btn');
  const searchInput = document.getElementById('store-search');
  const storeCards = document.querySelectorAll('#grid-store .product-card');

  if (!searchInput) return;

  let currentCat = 'all';
  let searchTerm = '';

  const filterCards = () => {
    storeCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const title = card.querySelector('.product-title').innerText.toLowerCase();

      const matchCat = currentCat === 'all' || cat === currentCat;
      const matchSearch = title.includes(searchTerm);

      if (matchCat && matchSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.getAttribute('data-filter');
      filterCards();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    filterCards();
  });
}

// ==== ANIMATIONS ====
function initAnimations() {
  const animatedElements = document.querySelectorAll('.page.active .fade-in');
  animatedElements.forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null;
  });
}

// ==== MODAL EMAIL CAPTURE ====
function checkModal() {
  const modal = document.getElementById('email-modal');
  const closeBtn = document.querySelector('.modal-close');

  if (!modal) return;

  const hasSeenModal = localStorage.getItem('earnSmartModalSeen');

  if (!hasSeenModal) {
    setTimeout(() => {
      modal.classList.add('active');
      localStorage.setItem('earnSmartModalSeen', 'true');
    }, 15000); // Show after 15 seconds
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
}
