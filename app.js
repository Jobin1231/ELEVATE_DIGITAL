// app.js — Elevate Digital

// ==== STATE MANAGEMENT ====
let cart = [];

// Mock Products Database
const products = [
  { id: 1, title: 'Freelancing & Digital Products', price: 199, oldPrice: 299, cat: 'freelance', rating: 4.9, reviews: 124, tag: null },
  { id: 2, title: 'Dropshipping for Indians', price: 199, oldPrice: 299, cat: 'dropship', rating: 4.8, reviews: 98, tag: 'Popular' },
  { id: 3, title: 'Stock & Crypto Basics', price: 199, oldPrice: 299, cat: 'trading', rating: 4.9, reviews: 156, tag: null },
  { id: 4, title: 'Earning with AI Tools', price: 199, oldPrice: 299, cat: 'ai', rating: 5.0, reviews: 210, tag: 'High Demand' },
  { id: 5, title: 'Create & Sell Your Own Guide', price: 199, oldPrice: 299, cat: 'digital', rating: 4.8, reviews: 85, tag: null },
  { id: 6, title: 'Complete Earn Online Bundle', price: 499, oldPrice: 995, cat: 'bundle', rating: 5.0, reviews: 342, tag: 'Signature' }
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
  initContactForm();
  initHeroParticles();
  initStatsCounter();
  initSocialProofCycle();
  initCardSpotlight();
  initEarningCalculator();
  initPreviewModal();

  // Mobile Menu
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const willOpen = !mobileMenu.classList.contains('active');
      mobileMenu.classList.toggle('active');
      if (willOpen) {
        history.pushState({
          isDrawer: true,
          pageId: history.state?.pageId || 'page-home',
          productId: currentProductId
        }, '', window.location.hash);
      }
    });
  }

  // Global Click listener for direct buy, add to cart & preview
  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.direct-buy-btn');
    if (buyBtn) {
      const id = parseInt(buyBtn.dataset.id);
      directBuy(id);
      return;
    }

    const prevBtn = e.target.closest('.preview-btn');
    if (prevBtn) {
      const id = parseInt(prevBtn.dataset.id);
      openPreviewModal(id);
      return;
    }

    if (e.target.classList.contains('preview-modal-close') || e.target.closest('.preview-modal-close') || e.target.id === 'preview-modal') {
      closePreviewModal();
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      const id = parseInt(addBtn.dataset.id);
      addToCart(id);
    }
  });

  // Razorpay Checkout Trigger
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (cart.length === 0) {
        showToast('Your acquisition cart is empty.');
        return;
      }

      const customerEmail = document.getElementById('checkout-email')?.value?.trim();
      const customerName = document.getElementById('checkout-name')?.value?.trim();
      const customerPhone = document.getElementById('checkout-phone')?.value?.trim();

      if (!customerEmail || !customerEmail.includes('@')) {
        alert('Please provide a valid email address so we can deliver your guide downloads.');
        document.getElementById('checkout-email')?.focus();
        return;
      }

      checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Security...';
      checkoutBtn.disabled = true;

      // Calculate total in paise
      let subtotalInRupees = 0;
      cart.forEach(item => {
        subtotalInRupees += item.price * item.qty;
      });
      const amountInPaise = Math.round(subtotalInRupees * 100);

      // Prepare download assets list
      const isBundleInCart = cart.some(i => i.id === 6);
      const downloads = [];

      if (isBundleInCart) {
        downloads.push(
          { name: 'Guide 1: Freelancing & High-Ticket Services', url: 'assets/guides/Guide_1_How_to_Start_Freelancing_Selling_Digital_Products_Online_in_India.pdf' },
          { name: 'Guide 2: Indian Dropshipping Architecture', url: 'assets/guides/Guide_2_Dropshipping_in_India.pdf' },
          { name: 'Guide 3: Stock Market & Crypto Foundations', url: 'assets/guides/Guide_3_Stock_Market_Crypto_Basics_for_Indian_Beginners.pdf' },
          { name: 'Guide 4: Earning with Generative AI', url: 'assets/guides/Guide_4_How_to_Earn_Money_Using_AI_Tools_in_India.pdf' },
          { name: 'Guide 5: Create & Sell Digital Guides', url: 'assets/guides/Guide_5_How_to_Create_Sell_Your_Own_Digital_Guide_Online.pdf' }
        );
      } else {
        const fileMap = {
          1: { name: 'Freelancing & Digital Products', file: 'Guide_1_How_to_Start_Freelancing_Selling_Digital_Products_Online_in_India.pdf' },
          2: { name: 'Dropshipping for Indians', file: 'Guide_2_Dropshipping_in_India.pdf' },
          3: { name: 'Stock & Crypto Basics', file: 'Guide_3_Stock_Market_Crypto_Basics_for_Indian_Beginners.pdf' },
          4: { name: 'Earning with AI Tools', file: 'Guide_4_How_to_Earn_Money_Using_AI_Tools_in_India.pdf' },
          5: { name: 'Create & Sell Your Own Guide', file: 'Guide_5_How_to_Create_Sell_Your_Own_Digital_Guide_Online.pdf' }
        };
        cart.forEach(item => {
          if (fileMap[item.id]) {
            downloads.push({
              name: fileMap[item.id].name,
              url: `assets/guides/${fileMap[item.id].file}`
            });
          }
        });
      }

      // Check if backend order creation is available; otherwise fallback to direct client-side Razorpay
      let orderId = null;
      let rzpKey = 'rzp_live_SkVXBySo7EC2s2'; // Live Razorpay Key

      try {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart.map(item => ({ id: item.id, qty: item.qty })) })
        });
        if (res.ok) {
          const orderData = await res.json();
          if (orderData.id) {
            orderId = orderData.id;
            if (orderData.key) rzpKey = orderData.key;
          }
        }
      } catch (e) {
        // Fall back gracefully to direct client-side integration
      }

      if (typeof window.Razorpay === 'undefined') {
        alert('Payment gateway library is loading. Please try again in 3 seconds.');
        checkoutBtn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Authorise Payment & Download</span>';
        checkoutBtn.disabled = false;
        return;
      }

      const options = {
        key: rzpKey,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Elevate Digital',
        description: 'Masterclass Guide Acquisition',
        image: 'assets/cover_bundle.png',
        prefill: {
          name: customerName || 'Valued Reader',
          email: customerEmail,
          contact: customerPhone || ''
        },
        theme: { color: '#dfb15b' },
        handler: async function (response) {
          showSuccessModal(downloads);

          // Dispatch download links to customer's email via Web3Forms
          const downloadList = downloads
            .map(dl => `✦ ${dl.name}\n  Download Link: ${window.location.origin}/${dl.url}`)
            .join('\n\n');

          fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_key: 'a5859d2b-95fc-4352-a7be-479f80955f70',
              subject: '✦ Your Elevate Digital Master Guides — Access Inside',
              from_name: 'Elevate Digital Concierge',
              to: customerEmail,
              email: customerEmail,
              name: customerName || 'Elevate VIP Member',
              message: `Greetings ${customerName || ''},\n\nThank you for acquiring your masterclass guides from Elevate Digital!\n\nTransaction ID: ${response.razorpay_payment_id || 'VERIFIED'}\nAmount Paid: ₹${subtotalInRupees}\n\nYour encrypted access links:\n\n${downloadList}\n\n💡 Retain this dispatch — you maintain lifetime re-download authorization via these links.\n\nShould you require priority assistance, reply directly to this message.\n\nTo your digital mastery,\n— Aswin Krishna & Team Elevate Digital`
            })
          }).catch(err => console.error('Email delivery error:', err));

          cart = [];
          updateCartBadge();
          renderCart();
        }
      };

      if (orderId) {
        options.order_id = orderId;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert('Payment Cancelled or Failed: ' + (resp.error ? resp.error.description : 'Please try again.'));
      });
      rzp.open();

      checkoutBtn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>Authorise Payment & Download</span>';
      checkoutBtn.disabled = false;
    });
  }

  // Close Success Modal
  const successModal = document.getElementById('success-modal');
  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        successModal.classList.remove('active');
        navigateTo('page-home');
      }
    });
  }
});

// ==== SUCCESS MODAL RENDERER ====
function showSuccessModal(downloads) {
  const container = document.getElementById('download-links-container');
  const modal = document.getElementById('success-modal');
  if (!container || !modal) return;

  container.innerHTML = '';
  downloads.forEach(dl => {
    const btn = document.createElement('a');
    btn.href = dl.url;
    btn.className = 'btn btn-gold';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.gap = '0.6rem';
    btn.target = '_blank';
    btn.innerHTML = `<i class="fa-solid fa-download"></i> <span>Download: ${dl.name}</span>`;
    container.appendChild(btn);
  });

  modal.classList.add('active');
}

// ==== SPA ROUTING & BROWSER HISTORY ====
let currentProductId = 1;

const ROUTE_HASH_MAP = {
  'page-home': '#/home',
  'page-store': '#/collection',
  'page-cart': '#/cart',
  'page-about': '#/author',
  'page-contact': '#/concierge'
};

function getHashForRoute(pageId, productId) {
  if (pageId === 'page-detail') {
    return `#/product/${productId || currentProductId || 1}`;
  }
  return ROUTE_HASH_MAP[pageId] || '#/home';
}

function parseRouteFromHash(hash) {
  const clean = (hash || '').replace(/^#\/?/, '').trim().toLowerCase();

  if (!clean || clean === 'home') {
    return { pageId: 'page-home', productId: null };
  }
  if (clean === 'collection' || clean === 'store' || clean === 'books' || clean === 'vault') {
    return { pageId: 'page-store', productId: null };
  }
  if (clean.startsWith('product/')) {
    const parts = clean.split('/');
    const id = parseInt(parts[1]) || 1;
    return { pageId: 'page-detail', productId: id };
  }
  if (clean === 'cart' || clean === 'checkout') {
    return { pageId: 'page-cart', productId: null };
  }
  if (clean === 'author' || clean === 'about') {
    return { pageId: 'page-about', productId: null };
  }
  if (clean === 'concierge' || clean === 'contact' || clean === 'support') {
    return { pageId: 'page-contact', productId: null };
  }

  return { pageId: 'page-home', productId: null };
}

function initRouter() {
  // Global click listener for all navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (!link) return;

    e.preventDefault();

    // Check if back-link clicked
    if (link.classList.contains('back-link')) {
      if (window.history.length > 1 && history.state?.pageId && history.state.pageId !== 'page-home') {
        window.history.back();
        return;
      }
      navigateTo('page-store', null, true);
      return;
    }

    const targetId = link.getAttribute('data-target');
    if (!targetId) return;

    let targetProductId = null;
    if (targetId === 'page-detail') {
      const card = link.closest('.product-card');
      const idEl = card?.querySelector('.add-to-cart-btn') || card?.querySelector('.direct-buy-btn');
      targetProductId = parseInt(link.dataset.id || idEl?.dataset.id || 1);
    }

    navigateTo(targetId, targetProductId, true);
  });

  // Handle mobile / browser back and forward buttons
  window.addEventListener('popstate', (e) => {
    // 1. Close preview modal if active
    const previewModal = document.getElementById('preview-modal');
    if (previewModal && previewModal.classList.contains('active')) {
      closePreviewModal(true);
      return;
    }

    // 2. Close mobile drawer if active
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      return;
    }

    // 3. Close other modals if active
    const successModal = document.getElementById('success-modal');
    if (successModal && successModal.classList.contains('active')) {
      successModal.classList.remove('active');
      return;
    }
    const emailModal = document.getElementById('email-modal');
    if (emailModal && emailModal.classList.contains('active')) {
      emailModal.classList.remove('active');
      return;
    }

    // 4. Navigate smoothly to previous state or route
    if (e.state && e.state.pageId) {
      navigateTo(e.state.pageId, e.state.productId, false);
    } else {
      const route = parseRouteFromHash(window.location.hash);
      navigateTo(route.pageId, route.productId, false);
    }
  });

  // Initial Route Resolution on page load
  const initialRoute = parseRouteFromHash(window.location.hash);
  navigateTo(initialRoute.pageId, initialRoute.productId, false);
}

function navigateTo(pageId, productId = null, pushHistory = true) {
  if (pageId === 'page-detail') {
    if (productId) {
      currentProductId = productId;
    }
    loadProductDetail(currentProductId || 1);
  }

  pages.forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    initAnimations();
    initCardSpotlight();
  }

  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }

  // Update active state across all navigation links
  const allNavLinks = document.querySelectorAll('.nav-link');
  allNavLinks.forEach(l => {
    if (l.getAttribute('data-target') === pageId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  // Browser History Management
  const targetHash = getHashForRoute(pageId, productId || currentProductId);
  if (pushHistory) {
    const currentState = history.state;
    const isSamePage = currentState && currentState.pageId === pageId;
    const isSameProduct = pageId !== 'page-detail' || (currentState && currentState.productId === (productId || currentProductId));

    if (!isSamePage || !isSameProduct) {
      history.pushState({ pageId: pageId, productId: productId || currentProductId }, '', targetHash);
    }
  } else {
    history.replaceState({ pageId: pageId, productId: productId || currentProductId }, '', targetHash);
  }
}

// ==== DYNAMIC DETAIL PAGE ====
function loadProductDetail(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const catMap = {
    bundle: { name: '★ SIGNATURE BOX SET', class: 'badge-gold' },
    freelance: { name: 'FREELANCE BLUEPRINT', class: 'badge-sapphire' },
    dropship: { name: 'COMMERCE PLAYBOOK', class: 'badge-sapphire' },
    trading: { name: 'MARKET DISCIPLINE', class: 'badge-emerald' },
    ai: { name: 'AI INCOME ENGINE', class: 'badge-amethyst' },
    digital: { name: 'AUTHORING BLUEPRINT', class: 'badge-gold' }
  };

  const catInfo = catMap[product.cat] || { name: 'MASTER EDITION', class: 'badge-gold' };

  const detailBadge = document.getElementById('detail-badge');
  if (detailBadge) {
    detailBadge.innerText = catInfo.name;
    detailBadge.className = `badge ${catInfo.class}`;
  }

  if (document.getElementById('detail-title')) {
    document.getElementById('detail-title').innerText = product.title;
  }

  if (document.getElementById('detail-reviews')) {
    document.getElementById('detail-reviews').innerText = `${product.rating} (${product.reviews} Reviews)`;
  }

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

  const descMap = {
    1: 'The definitive Upwork and Fiverr positioning playbook. Learn how to craft high-converting proposals, price services in USD/EUR, and acquire international clients consistently without prior credentials.',
    2: 'A complete tactical masterclass for domestic Indian e-commerce. How to partner with suppliers via Meesho, set up high-converting WhatsApp & Instagram organic funnels, and generate profit with zero upfront inventory.',
    3: 'Intelligent, risk-mitigated wealth building for young Indians. Learn the fundamentals of equity valuation, mutual funds, asset allocation, and how to avoid high-risk trading traps.',
    4: 'Harness state-of-the-art AI tools (ChatGPT, Midjourney, Claude) to accelerate client work, offer automated digital services, and generate reliable income streams in 2026.',
    5: 'Transform your specific knowledge into a high-margin digital asset. Step-by-step roadmap to authoring, formatting, pricing, and selling your own PDF playbooks with automated Indian payment rails.',
    6: 'The complete 5-guide digital wealth collection. Receive all master editions, copy-paste proposal templates, prompt libraries, and exclusive updates in one unified archive.'
  };

  if (document.getElementById('detail-desc')) {
    document.getElementById('detail-desc').innerText = descMap[product.id] || 'This comprehensive guide brings you the exact, step-by-step blueprints to start generating income online in India through proven methods.';
  }

  if (document.getElementById('detail-oldprice')) {
    document.getElementById('detail-oldprice').innerText = `₹${product.oldPrice}`;
  }

  if (document.getElementById('detail-price')) {
    document.getElementById('detail-price').innerText = `₹${product.price}`;
  }

  if (document.getElementById('detail-savings')) {
    const savings = product.oldPrice - product.price;
    document.getElementById('detail-savings').innerText = `✦ YOU SAVE ₹${savings} TODAY`;
  }

  const buyBtn = document.getElementById('detail-buy-btn');
  if (buyBtn) {
    buyBtn.setAttribute('data-id', product.id);
    buyBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Buy Now — ₹${product.price}`;
  }

  const previewBtn = document.getElementById('detail-preview-btn');
  if (previewBtn) {
    previewBtn.setAttribute('data-id', product.id);
  }

  const addBtn = document.getElementById('detail-add-btn');
  if (addBtn) {
    addBtn.setAttribute('data-id', product.id);
    addBtn.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Add`;
  }
}

// ==== STICKY NAV ====
function initStickyNav() {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
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
  const countdownSection = document.querySelector('.countdown');

  if (!hoursEl) return;

  let expiryTime = localStorage.getItem('elevateBundleExpiry');
  const now = new Date().getTime();

  if (!expiryTime) {
    expiryTime = now + (48 * 60 * 60 * 1000);
    localStorage.setItem('elevateBundleExpiry', expiryTime.toString());
  } else {
    expiryTime = parseInt(expiryTime);
  }

  if (now > expiryTime) {
    if (countdownSection) countdownSection.style.display = 'none';
    return;
  }

  setInterval(() => {
    const currentTime = new Date().getTime();
    const distance = expiryTime - currentTime;

    if (distance < 0) {
      if (countdownSection) countdownSection.style.display = 'none';
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    hoursEl.innerText = hours.toString().padStart(2, '0');
    minsEl.innerText = minutes.toString().padStart(2, '0');
    secsEl.innerText = seconds.toString().padStart(2, '0');
  }, 1000);
}

// ==== DIRECT BUY (1-CLICK CHECKOUT) ====
function directBuy(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (!existingItem) {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  renderCart();
  navigateTo('page-cart');
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
  showToast(`Added ${product.title} to Cart`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartBadge) cartBadge.innerText = count;
}

function renderCart() {
  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="color:var(--muted); padding: 2rem 0; text-align:center;">Your acquisition cart is empty.</p>';
    if (cartTotal) cartTotal.innerText = '₹0';
    return;
  }

  cartContainer.innerHTML = '';
  let subtotal = 0;

  const coverMap = {
    1: 'assets/cover_freelance.png',
    2: 'assets/cover_dropship.png',
    3: 'assets/cover_trading.png',
    4: 'assets/cover_ai.png',
    5: 'assets/cover_digital.png',
    6: 'assets/cover_bundle.png'
  };

  cart.forEach(item => {
    subtotal += item.price * item.qty;

    cartContainer.innerHTML += `
      <div class="cart-item">
        <img src="${coverMap[item.id] || 'assets/cover_bundle.png'}" alt="${item.title}">
        <div style="flex-grow:1;">
          <h4 style="font-family:var(--font-serif); font-size:1.05rem; margin-bottom:0.25rem; color:#ffffff;">${item.title}</h4>
          <div style="color:var(--muted); font-size:0.85rem;">Quantity: ${item.qty}</div>
          <div style="font-weight:700; color:var(--gold-light); font-size:1.15rem; margin-top:0.35rem; font-family:var(--font-serif);">₹${item.price}</div>
        </div>
        <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.4rem; padding:0.5rem; transition:color 0.2s;" onmouseover="this.style.color='#f43f5e'" onmouseout="this.style.color='var(--muted)'">&times;</button>
      </div>
    `;
  });

  if (cartTotal) cartTotal.innerText = `₹${subtotal}`;
}

// ==== NOTIFICATIONS / TOAST ====
function showToast(msg) {
  if (!toastBtn) return;
  const span = toastBtn.querySelector('span');
  if (span) span.innerText = msg;
  else toastBtn.innerText = msg;

  toastBtn.classList.add('show');
  setTimeout(() => {
    toastBtn.classList.remove('show');
  }, 3200);
}

// ==== FAQ ACCORDION ====
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
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
    el.offsetHeight; // trigger reflow
    el.style.animation = null;
  });
}

// ==== MODAL EMAIL CAPTURE ====
function checkModal() {
  const modal = document.getElementById('email-modal');
  const closeBtn = modal?.querySelector('.modal-close');

  if (!modal) return;

  const hasSeenModal = localStorage.getItem('elevateModalSeen');

  if (!hasSeenModal) {
    setTimeout(() => {
      modal.classList.add('active');
      localStorage.setItem('elevateModalSeen', 'true');
    }, 18000); // 18 seconds
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
}

// ==== CONTACT CONCIERGE FORM ====
function initContactForm() {
  const contactBtn = document.getElementById('contact-form-btn');
  if (!contactBtn) return;

  contactBtn.addEventListener('click', async () => {
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showToast('Please complete all correspondence fields.');
      return;
    }

    contactBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';
    contactBtn.disabled = true;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'a5859d2b-95fc-4352-a7be-479f80955f70',
          name: name,
          email: email,
          subject: `[Elevate Concierge] ${subject}`,
          message: message,
          from_name: 'Elevate Digital Concierge'
        })
      });

      const data = await res.json();

      if (data.success) {
        showToast('Message transmitted. Expect reply within 2–4 hours.');
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-subject').selectedIndex = 0;
        document.getElementById('contact-message').value = '';
      } else {
        showToast('Transmission error. Please try again.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showToast('Concierge connection issue. Please retry.');
    } finally {
      contactBtn.innerHTML = '<span>Transmit Message</span> <i class="fa-solid fa-paper-plane"></i>';
      contactBtn.disabled = false;
    }
  });
}

// ==== HERO LUXURY PARTICLES (GOLD DUST & STARLIGHT) ====
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const colors = [
    'rgba(250, 225, 156, 0.55)', // gold light
    'rgba(223, 177, 91, 0.45)',   // gold primary
    'rgba(255, 255, 255, 0.4)',   // diamond white
    'rgba(147, 197, 253, 0.3)'   // sapphire soft
  ];

  function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');

    const size = Math.random() * 3 + 1.2;
    const x = Math.random() * 100;
    const duration = Math.random() * 10 + 8;
    const delay = Math.random() * 4;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      bottom: -10px;
      background: ${color};
      box-shadow: 0 0 ${size * 3}px ${color};
      animation: particleDrift ${duration}s linear ${delay}s infinite;
    `;

    container.appendChild(particle);

    setTimeout(() => {
      particle.remove();
      createParticle();
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < 28; i++) {
    createParticle();
  }
}

// ==== STATS COUNTER ANIMATION ====
function initStatsCounter() {
  const statNums = document.querySelectorAll('.hero-stat-num');
  if (statNums.length === 0) return;

  function animateCounters() {
    statNums.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'));
      const duration = 2200;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easedProgress * target);

        num.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          num.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(updateCount);
    });
  }

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    setTimeout(animateCounters, 400);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
        }
      });
    }, { threshold: 0.3 });
    observer.observe(heroStats);
  }
}

// ==== VIP SOCIAL PROOF CYCLING ====
function initSocialProofCycle() {
  const proofEl = document.getElementById('hero-social-proof');
  if (!proofEl) return;

  const buyers = [
    { initials: 'NK', name: 'Nisha K.', product: 'the Master Bundle', time: '2 min ago' },
    { initials: 'AM', name: 'Arjun M.', product: 'AI Income Engine', time: '5 min ago' },
    { initials: 'SB', name: 'Sanya B.', product: 'Freelance Blueprint', time: '9 min ago' },
    { initials: 'RV', name: 'Rohan V.', product: 'the Master Bundle', time: '14 min ago' },
    { initials: 'MJ', name: 'Meera J.', product: 'Market Discipline', time: '18 min ago' },
    { initials: 'KR', name: 'Karthik R.', product: 'Dropshipping Playbook', time: '22 min ago' },
    { initials: 'TP', name: 'Tanvi P.', product: 'the Master Bundle', time: '29 min ago' }
  ];

  let currentIndex = 0;

  function showProof() {
    const buyer = buyers[currentIndex];
    proofEl.querySelector('.hero-proof-avatar').textContent = buyer.initials;
    proofEl.querySelector('strong').textContent = buyer.name;
    const itemSpan = proofEl.querySelector('.hero-proof-item span');
    if (itemSpan) itemSpan.textContent = buyer.product;
    proofEl.querySelector('.hero-proof-time').textContent = buyer.time;

    proofEl.style.animation = 'none';
    proofEl.offsetHeight; // trigger reflow
    proofEl.style.animation = 'proofSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';

    setTimeout(() => {
      proofEl.style.animation = 'proofSlideOut 0.5s ease-in forwards';
    }, 5500);

    currentIndex = (currentIndex + 1) % buyers.length;
  }

  setTimeout(() => {
    showProof();
    setInterval(showProof, 13000);
  }, 3500);
}

// ==== CURSOR CARD SPOTLIGHT EFFECT ====
function initCardSpotlight() {
  const elements = document.querySelectorAll('[data-spotlight]');
  elements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// ==== INTERACTIVE EARNING CALCULATOR ====
function initEarningCalculator() {
  const pathsContainer = document.getElementById('calc-paths');
  const hoursSlider = document.getElementById('calc-hours-slider');
  const hoursDisplay = document.getElementById('calc-hours-val');
  const earningsNum = document.getElementById('calc-earnings-num');
  const verdictText = document.getElementById('calc-verdict-text');
  const timelineVal = document.getElementById('calc-meta-timeline');
  const capitalVal = document.getElementById('calc-meta-capital');
  const difficultyVal = document.getElementById('calc-meta-difficulty');
  const recTitle = document.getElementById('calc-rec-title');
  const buyBtn = document.getElementById('calc-direct-buy-btn');
  const buyLabel = document.getElementById('calc-buy-label');
  const previewBtn = document.getElementById('calc-preview-btn');

  if (!pathsContainer || !hoursSlider) return;

  const pathModels = {
    freelance: {
      id: 1,
      title: 'Freelancing & High-Ticket Services',
      price: 199,
      timeline: '14–21 Days',
      capital: '₹0 (Zero Capital)',
      difficulty: 'Beginner-Friendly',
      verdict: 'Target achievable within 30–45 days using our step-by-step diagnostic proposal framework.',
      rates: { 5: '12,000 – 20,000', 10: '25,000 – 45,000', 15: '35,000 – 65,000', 20: '50,000 – 90,000', 25: '70,000 – 1,20,000', 30: '90,000 – 1,60,000' }
    },
    dropship: {
      id: 2,
      title: 'Indian Dropshipping Architecture',
      price: 199,
      timeline: '7–14 Days',
      capital: '₹500 – ₹1,000 (Testing)',
      difficulty: 'Action-Heavy',
      verdict: 'Direct domestic cash flow via Meesho & WhatsApp organic loops with zero advance inventory purchase.',
      rates: { 5: '10,000 – 18,000', 10: '22,000 – 40,000', 15: '35,000 – 60,000', 20: '50,000 – 85,000', 25: '75,000 – 1,30,000', 30: '1,00,000 – 2,00,000' }
    },
    trading: {
      id: 3,
      title: 'Stock & Crypto Foundations',
      price: 199,
      timeline: '30–60 Days',
      capital: '₹1,000+ (Investment)',
      difficulty: 'Analytical',
      verdict: 'Mathematical asset allocation and discipline designed to compound capital steadily without speculative gambling.',
      rates: { 5: '8,000 – 15,000', 10: '18,000 – 30,000', 15: '28,000 – 50,000', 20: '40,000 – 70,000', 25: '60,000 – 1,00,000', 30: '80,000 – 1,40,000' }
    },
    ai: {
      id: 4,
      title: 'Earning with Generative AI',
      price: 199,
      timeline: '10–20 Days',
      capital: '₹0 (Zero Capital)',
      difficulty: 'High Leverage',
      verdict: 'High-leverage AI workflows delivering automated content, code, and marketing assets for domestic and international clients.',
      rates: { 5: '15,000 – 25,000', 10: '30,000 – 55,000', 15: '45,000 – 80,000', 20: '65,000 – 1,10,000', 25: '90,000 – 1,50,000', 30: '1,20,000 – 2,20,000' }
    },
    digital: {
      id: 5,
      title: 'Create & Sell Digital Guides',
      price: 199,
      timeline: '21–30 Days',
      capital: '₹0 (Zero Capital)',
      difficulty: 'Beginner-Friendly',
      verdict: 'Pure 95% margin automated digital assets that sell 24/7 on autopilot through UPI and Razorpay funnels.',
      rates: { 5: '10,000 – 22,000', 10: '25,000 – 50,000', 15: '40,000 – 85,000', 20: '60,000 – 1,20,000', 25: '85,000 – 1,80,000', 30: '1,20,000 – 2,50,000' }
    }
  };

  let selectedPath = 'freelance';

  function updateCalculator() {
    const hours = parseInt(hoursSlider.value) || 10;
    const model = pathModels[selectedPath];
    if (!model) return;

    if (hoursDisplay) hoursDisplay.innerText = `${hours} Hours / Week`;

    const earnings = model.rates[hours] || model.rates[10];
    if (earningsNum) earningsNum.innerText = earnings;
    if (verdictText) verdictText.innerText = model.verdict;
    if (timelineVal) timelineVal.innerText = model.timeline;
    if (capitalVal) capitalVal.innerText = model.capital;
    if (difficultyVal) difficultyVal.innerText = model.difficulty;
    if (recTitle) recTitle.innerText = model.title;

    if (buyBtn) {
      buyBtn.setAttribute('data-id', model.id);
    }
    if (buyLabel) {
      buyLabel.innerText = `Buy Guide Now — ₹${model.price}`;
    }
    if (previewBtn) {
      previewBtn.setAttribute('data-id', model.id);
    }
  }

  pathsContainer.querySelectorAll('.calc-path-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pathsContainer.querySelectorAll('.calc-path-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPath = btn.getAttribute('data-path') || 'freelance';
      updateCalculator();
    });
  });

  hoursSlider.addEventListener('input', updateCalculator);

  // Initial Calculation
  updateCalculator();
}

// ==== LOOK INSIDE PREVIEW MODAL ====
const previewVault = {
  1: {
    badge: 'FREELANCE BLUEPRINT PREVIEW',
    title: 'Freelancing & High-Ticket Services',
    subtitle: 'Step-by-step masterclass on acquiring international clients paying in USD/EUR without past credentials.',
    price: 199,
    oldPrice: 299,
    excerpt: `
      <div class="preview-chapter-meta">Chapter 1 • Page 14 Excerpt</div>
      <h3 class="preview-chapter-title">The Zero-Degree Positioning Matrix</h3>
      <p class="preview-text-block">
        Most Indian freelancers fail before they even submit a proposal because they compete in what economists call the <em>commodity gutter</em>. When a European or American business owner posts a job for a copywriter, video editor, or developer, they receive 50+ proposals within two hours.
      </p>
      <div class="preview-callout">
        “Clients do not care about your university degree or your marks. They care about their time, their revenue, and their risk. When you show them how you eliminate their risk, price becomes secondary.”
      </div>
      <p class="preview-text-block">
        In this chapter, we deploy the <strong>Diagnostic Hook</strong>. Instead of writing <em>“Dear Sir, I am a dedicated worker with 3 years experience...”</em>, you initiate with a 3-sentence teardown of a high-value friction point on their landing page or social feed. You immediately disqualify yourself from the race to the bottom and position yourself as a specialized consultant.
      </p>
    `,
    toc: [
      { num: '01', title: 'The Global Arbitrage Equation', sub: 'Earning in USD/EUR while spending in INR' },
      { num: '02', title: 'High-Income Skill Identification', sub: 'Selecting your lane without coding degrees' },
      { num: '03', title: 'The Diagnostic Hook & Proposal Matrix', sub: '5 battle-tested scripts that achieve 40%+ reply rates' },
      { num: '04', title: 'Contract Architecture & Milestone Protection', sub: 'Securing 50% upfront deposits via Escrow & Stripe' },
      { num: '05', title: 'Sourcing Private Retainers Beyond Upwork', sub: 'Direct LinkedIn & Cold Email outreach workflows' }
    ],
    outcomes: [
      { title: 'Secure $300–$800 Retainers', sub: 'Acquire international clients willing to pay Western rates for verified results.' },
      { title: '5 Copy-Paste Proposal Scripts', sub: 'Plug-and-play pitch frameworks proven across 200+ student cohort wins.' },
      { title: 'Razorpay & Wise Payment Rails', sub: 'Receive international payments directly into your Indian bank account safely.' },
      { title: '30-Day Execution Calendar', sub: 'Day-by-day protocol to close your first paying client within a single month.' }
    ]
  },
  2: {
    badge: 'COMMERCE PLAYBOOK PREVIEW',
    title: 'Indian Dropshipping Architecture',
    subtitle: 'Domestic zero-inventory commerce engineered specifically for the Indian consumer and payment landscape.',
    price: 199,
    oldPrice: 299,
    excerpt: `
      <div class="preview-chapter-meta">Chapter 2 • Page 26 Excerpt</div>
      <h3 class="preview-chapter-title">The Domestic RTO Neutralizer</h3>
      <p class="preview-text-block">
        Western e-commerce influencers preach dropshipping from AliExpress or paying ₹5,000/day in Facebook ads. In India, following that generic advice is suicide due to <strong>Cash on Delivery (COD) Return to Origin (RTO)</strong> rates, which frequently wipe out entire bank accounts.
      </p>
      <div class="preview-callout">
        “An unconfirmed COD order is not a sale — it is an active liability. The entire game in Indian e-commerce is turning tentative buyers into committed deliveries before the parcel leaves the supplier.”
      </div>
      <p class="preview-text-block">
        Inside Section 2, you receive our proprietary <strong>3-Step WhatsApp Confirmation Loop</strong>. By automating a conversational WhatsApp voice note and order verification message immediately upon checkout, our students slash return rates from 42% down to under 11%, instantly securing clean double-digit net profit margins.
      </p>
    `,
    toc: [
      { num: '01', title: 'Indian Consumer Psychology & Pricing', sub: 'Finding impulse-buy products between ₹499 and ₹999' },
      { num: '02', title: 'Zero-Inventory Domestic Sourcing', sub: 'Direct supplier integration via Meesho, Roposo & local hubs' },
      { num: '03', title: 'The Zero Ad-Spend Traffic Funnel', sub: 'Harnessing Instagram aesthetic curation and viral reels' },
      { num: '04', title: 'The WhatsApp RTO Slashing Protocol', sub: 'Automated confirmation scripts that protect margins' },
      { num: '05', title: 'Scaling to ₹50,000/Month Net Profit', sub: 'Automating logistics, customer support and cash reconciliation' }
    ],
    outcomes: [
      { title: 'Zero Advance Inventory Needed', sub: 'Start testing winning products with less than ₹1,000 upfront risk.' },
      { title: 'Cut COD Returns by 70%', sub: 'Use battle-tested verification scripts to protect shipping and packing costs.' },
      { title: 'Free Organic Viral Traffic', sub: 'Learn the exact video format hooks that generate views without running paid ads.' },
      { title: 'Verified Supplier Rolodex', sub: 'Get direct WhatsApp access to trusted domestic Indian suppliers.' }
    ]
  },
  3: {
    badge: 'MARKET DISCIPLINE PREVIEW',
    title: 'Stock & Crypto Foundations',
    subtitle: 'Mathematical principles of capital allocation and wealth preservation for young Indian investors.',
    price: 199,
    oldPrice: 299,
    excerpt: `
      <div class="preview-chapter-meta">Chapter 1 • Page 9 Excerpt</div>
      <h3 class="preview-chapter-title">The Casino Trap vs. Sovereign Compounding</h3>
      <p class="preview-text-block">
        According to SEBI’s official regulatory disclosures, over <strong>89% of individual retail traders in India lose significant money</strong> in Futures & Options (F&O). The entire financial influencer ecosystem is financed by broker affiliate payouts that profit when you churn your account.
      </p>
      <div class="preview-callout">
        “Speculation is the tax that impatience pays to market institutions. True generational wealth in the Indian economy is engineered quietly through asset ownership and asymmetrical upside.”
      </div>
      <p class="preview-text-block">
        This edition teaches you how to construct an automated compounding machine using the <em>Indian Golden Triangle</em>: Nifty 50 indexing, high-ROCE domestic compounders, and sovereign self-custodied Bitcoin storage. You will never again stare at candlestick charts all afternoon.
      </p>
    `,
    toc: [
      { num: '01', title: 'Why 89% of Indian Retail Traders Lose', sub: 'The behavioral mathematics of brokerage traps' },
      { num: '02', title: 'The Indian Compounding Engine', sub: 'Low-cost index funds, mutual fund direct plans & SIP automation' },
      { num: '03', title: 'Fundamental Company Screening', sub: 'Using Screener.in to filter ROCE, debt, and free cash flows' },
      { num: '04', title: 'Sovereign Digital Asset Principles', sub: 'Cold storage security and Bitcoin as an asymmetric hedge' },
      { num: '05', title: 'The 10-Year Student Freedom Blueprint', sub: 'How compounding ₹2,500/month unlocks real sovereignty' }
    ],
    outcomes: [
      { title: 'Shield Your Capital From Losses', sub: 'Avoid the high-leverage F&O traps that ruin student savings.' },
      { title: 'Institutional Screener Formulas', sub: 'Filter high-performing Indian equities using Screener.in ratios.' },
      { title: 'Automated Stress-Free Investing', sub: 'Set up an automated monthly wealth allocation system in 15 minutes.' },
      { title: 'Sovereign Crypto Storage Guide', sub: 'Learn self-custody principles to protect assets against exchange crashes.' }
    ]
  },
  4: {
    badge: 'AI SYSTEMS PREVIEW',
    title: 'Earning with Generative AI',
    subtitle: 'Monetizing state-of-the-art AI tools to automate high-ticket client deliverables and content pipelines.',
    price: 199,
    oldPrice: 299,
    excerpt: `
      <div class="preview-chapter-meta">Chapter 2 • Page 18 Excerpt</div>
      <h3 class="preview-chapter-title">Prompt Architecture as Economic Arbitrage</h3>
      <p class="preview-text-block">
        Clients will never pay you for a prompt; they pay you to eliminate expensive, time-consuming bottlenecks. An Indian SME or e-commerce founder currently pays ₹50,000 to ₹1,00,000 per month for content writers, ad copywriters, and SEO specialists.
      </p>
      <div class="preview-callout">
        “AI does not replace practitioners; practitioners who wield multi-step chain-of-thought prompt architectures replace everyone who works manually.”
      </div>
      <p class="preview-text-block">
        By mastering our <strong>Role-Objective-Constraint-Iteration (ROCI) framework</strong>, you can produce enterprise-grade marketing campaigns, landing page copy, and localized customer support knowledge bases in under 90 minutes. You package this as a monthly ₹25,000 retainer that takes 3 hours of your week to fulfill.
      </p>
    `,
    toc: [
      { num: '01', title: 'The Generative AI Opportunity in India', sub: 'Where businesses are actively overpaying for slow labor' },
      { num: '02', title: 'The ROCI Prompt Engineering Framework', sub: 'Few-shot prompting, persona injection & output formatting' },
      { num: '03', title: 'Commercial Visual Generation', sub: 'Midjourney & Leonardo for product photography and ad creative' },
      { num: '04', title: 'Packaging AI Agency Retainers', sub: 'How to pitch and price recurring content services to brands' },
      { num: '05', title: 'The 50+ Enterprise Prompt Swipe Library', sub: 'Direct copy-paste prompts for instant production' }
    ],
    outcomes: [
      { title: 'Build a ₹30,000/Mo AI Retainer', sub: 'Package high-speed content acceleration services for local & online brands.' },
      { title: '50+ Enterprise Prompt Library', sub: 'Ready-to-use prompt templates for ads, sales copy, blogs, and code.' },
      { title: 'Cut Deliverable Time by 85%', sub: 'Complete 10 hours of traditional client work in 90 minutes with superior quality.' },
      { title: 'Client Pitch & Closing Scripts', sub: 'Exact email & WhatsApp messages that win over business owners.' }
    ]
  },
  5: {
    badge: 'AUTHORING BLUEPRINT PREVIEW',
    title: 'Create & Sell Digital Guides',
    subtitle: 'The complete framework to author, design, and automate sales of high-margin PDF playbooks in India.',
    price: 199,
    oldPrice: 299,
    excerpt: `
      <div class="preview-chapter-meta">Chapter 1 • Page 8 Excerpt</div>
      <h3 class="preview-chapter-title">The 95% Margin Digital Asset</h3>
      <p class="preview-text-block">
        A digital playbook is the highest-leverage product a human can create. You author it once, package it with aesthetic precision, and connect it to automated payment rails. It costs ₹0 to manufacture, ₹0 to ship, and generates income while you sleep.
      </p>
      <div class="preview-callout">
        “You do not need a university chair or 30 years in corporate life. You simply need to be two steps ahead of your audience on a problem they urgently want solved.”
      </div>
      <p class="preview-text-block">
        Whether you know how to prepare for government exams, edit viral short-form videos, or code in Python, your structured knowledge is worth ₹199 to ₹499 to thousands of young Indians. In Section 3, we build the exact Razorpay automated delivery pipeline with zero monthly software subscriptions.
      </p>
    `,
    toc: [
      { num: '01', title: 'Extracting High-Urgency Knowledge', sub: 'Finding topics people eagerly pay to learn fast' },
      { num: '02', title: 'The 7-Day Rapid Authoring Sprint', sub: 'Structuring chapters for maximum readability and speed' },
      { num: '03', title: 'Luxury Visual Packaging in Canva', sub: '3D mockup creation, cover aesthetics & editorial typography' },
      { num: '04', title: 'Automated Indian Checkout Architecture', sub: 'Setting up Razorpay buttons, UPI QR codes & instant email delivery' },
      { num: '05', title: 'Organic Distribution & Audience Building', sub: 'Turning Twitter, LinkedIn and Instagram readers into buyers' }
    ],
    outcomes: [
      { title: 'Launch Your Guide in 7 Days', sub: 'Follow our structured authoring sprint to finish your book quickly.' },
      { title: 'Keep 95%+ Pure Profit Margins', sub: 'Zero shipping, zero manufacturing, and zero recurring monthly fees.' },
      { title: 'Automated 24/7 UPI & Card Sales', sub: 'Customers pay via PhonePe/GPay and receive encrypted PDFs instantly.' },
      { title: 'High-Converting Sales Copy Template', sub: 'Our proven landing page layout that converts cold visitors into buyers.' }
    ]
  },
  6: {
    badge: 'SIGNATURE MASTER BUNDLE PREVIEW',
    title: 'The Complete Master Bundle (5-in-1)',
    subtitle: 'The definitive wealth suite. All 5 master playbooks plus 4 exclusive VIP fast-action bonus vaults.',
    price: 499,
    oldPrice: 995,
    excerpt: `
      <div class="preview-chapter-meta">Master Suite Archival Overview</div>
      <h3 class="preview-chapter-title">The Multi-Stream Sovereign Architecture</h3>
      <p class="preview-text-block">
        True financial resilience is never built on a single client, a single employer, or a single platform algorithm. When you combine <strong>active high-ticket service arbitrage</strong> with <strong>domestic e-commerce cash flow</strong> and <strong>automated digital products</strong>, you build an anti-fragile financial engine.
      </p>
      <div class="preview-callout">
        “By holding the complete repository, you never wonder which path is right for you. You test each model with verified frameworks, stack your income streams, and build compounding sovereignty.”
      </div>
      <p class="preview-text-block">
        The Signature Master Bundle unlocks all 5 master editions, plus all 4 VIP Fast-Action Vaults: the 50+ AI Prompt Library, the Proposal Swipe Files, the Verified Dropship Supplier Directory, and the 30-Day Zero-to-Cash Checklist. Over 2,400+ ambitious Indians have enrolled.
      </p>
    `,
    toc: [
      { num: '01', title: 'Guide 1: Freelancing & High-Ticket Services', sub: 'Upwork mastery, USD client acquisition & proposal scripts' },
      { num: '02', title: 'Guide 2: Indian Dropshipping Architecture', sub: 'Zero-inventory Meesho integration, viral traffic & COD reduction' },
      { num: '03', title: 'Guide 3: Stock & Crypto Foundations', sub: 'Mathematical capital preservation, Nifty SIPs & ROCE screening' },
      { num: '04', title: 'Guide 4: Earning with Generative AI', sub: 'Commercial prompt engineering & monthly recurring client retainers' },
      { num: '05', title: 'Guide 5: Create & Sell Digital Guides', sub: 'Authoring, 95% margin assets & automated Indian checkout funnels' },
      { num: 'VIP', title: 'Bonus Stack: 4 Fast-Action Vaults (Worth ₹1,496)', sub: 'AI Prompts Vault, Upwork Swipes, Supplier Rolodex & 30-Day Roadmap' }
    ],
    outcomes: [
      { title: 'All 5 Masterclass Playbooks Included', sub: 'Lifetime access to all 5 verified digital wealth editions in encrypted PDF format.' },
      { title: 'Save Over 50% Compared to Individual', sub: 'Combined value of ₹995 for just ₹499 one-time investment.' },
      { title: '4 VIP Fast-Action Bonuses (Free)', sub: 'Instant access to AI prompts, proposal swipes, supplier rolodex & 30-day checklist.' },
      { title: 'Lifetime Free Archival Updates', sub: 'Receive all future revised editions and new templates at no additional charge.' }
    ]
  }
};

let currentPreviewId = 1;
let currentPreviewTab = 'excerpt';

function initPreviewModal() {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;

  const tabBtns = modal.querySelectorAll('.preview-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPreviewTab = btn.getAttribute('data-tab') || 'excerpt';
      renderPreviewContent();
    });
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closePreviewModal();
    }
  });
}

function openPreviewModal(productId) {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;

  currentPreviewId = productId || 1;
  const data = previewVault[currentPreviewId] || previewVault[1];

  const badgeEl = document.getElementById('preview-badge');
  const titleEl = document.getElementById('preview-title');
  const subEl = document.getElementById('preview-subtitle');
  const priceEl = document.getElementById('preview-footer-price');
  const oldPriceEl = document.getElementById('preview-footer-oldprice');
  const buyBtn = document.getElementById('preview-buy-now-btn');
  const buyBtnText = document.getElementById('preview-buy-btn-text');

  if (badgeEl) badgeEl.innerText = data.badge;
  if (titleEl) titleEl.innerText = data.title;
  if (subEl) subEl.innerText = data.subtitle;
  if (priceEl) priceEl.innerText = `₹${data.price}`;
  if (oldPriceEl) oldPriceEl.innerText = `₹${data.oldPrice}`;

  if (buyBtn) {
    buyBtn.setAttribute('data-id', currentPreviewId);
  }
  if (buyBtnText) {
    buyBtnText.innerText = `Buy ${currentPreviewId === 6 ? 'Master Suite' : 'Guide'} — ₹${data.price}`;
  }

  // Reset to first tab
  currentPreviewTab = 'excerpt';
  modal.querySelectorAll('.preview-tab-btn').forEach((btn, index) => {
    if (index === 0) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  renderPreviewContent();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Push modal history state so mobile back button closes the modal
  history.pushState({
    isModal: true,
    pageId: history.state?.pageId || 'page-home',
    productId: currentProductId
  }, '', window.location.hash);
}

function closePreviewModal(fromHistory = false) {
  const modal = document.getElementById('preview-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';

  if (!fromHistory && history.state?.isModal) {
    history.back();
  }
}

function renderPreviewContent() {
  const bodyEl = document.getElementById('preview-body');
  if (!bodyEl) return;

  const data = previewVault[currentPreviewId] || previewVault[1];

  if (currentPreviewTab === 'excerpt') {
    bodyEl.innerHTML = `
      <div class="preview-excerpt-box">
        ${data.excerpt}
      </div>
    `;
  } else if (currentPreviewTab === 'toc') {
    let tocHtml = '<div class="preview-toc-list">';
    data.toc.forEach(item => {
      tocHtml += `
        <div class="preview-toc-item">
          <span class="toc-num">${item.num}</span>
          <div class="toc-info">
            <strong>${item.title}</strong>
            <span>${item.sub}</span>
          </div>
        </div>
      `;
    });
    tocHtml += '</div>';
    bodyEl.innerHTML = tocHtml;
  } else if (currentPreviewTab === 'outcomes') {
    let outHtml = '<div class="preview-outcomes-grid">';
    data.outcomes.forEach(out => {
      outHtml += `
        <div class="preview-outcome-card">
          <i class="fa-solid fa-circle-check"></i>
          <div>
            <strong>${out.title}</strong>
            <span>${out.sub}</span>
          </div>
        </div>
      `;
    });
    outHtml += '</div>';
    bodyEl.innerHTML = outHtml;
  }
}
