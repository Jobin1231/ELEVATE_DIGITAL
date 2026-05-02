// app.js

// ==== STATE MANAGEMENT ====
let cart = [];

// ==== RAZORPAY PAYMENT ====
// Automation handled by backend /api endpoints


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
  initContactForm();
  initHeroParticles();
  initStatsCounter();
  initSocialProofCycle();

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
    checkoutBtn.addEventListener('click', async () => {
      if(cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }
      
      checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
      checkoutBtn.disabled = true;

      try {
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart.map(item => ({ id: item.id, qty: item.qty })) })
        });
        const orderData = await res.json();

        if (!orderData.id) throw new Error('Order creation failed');

        const options = {
          key: orderData.key,  // Dynamically received from backend — no more hardcoding!
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Elevate Digital',
          description: 'Premium Guide Purchase',
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  items: cart 
                })
              });
              const verifyData = await verifyRes.json();
              
              if (verifyData.success) {
                showSuccessModal(verifyData.downloads);

                // Send download links to customer's email via Web3Forms
                const customerEmail = document.getElementById('checkout-email')?.value?.trim();
                if (customerEmail) {
                  const downloadList = verifyData.downloads
                    .map(dl => `📘 ${dl.name}\n   Download: ${dl.url}`)
                    .join('\n\n');

                  fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      access_key: 'a5859d2b-95fc-4352-a7be-479f80955f70',
                      subject: '🎉 Your EarnSmart Purchase — Download Links Inside!',
                      from_name: 'Elevate Digital',
                      to: customerEmail,
                      email: customerEmail,
                      name: 'EarnSmart Customer',
                      message: `Hi there! 👋\n\nThank you for your purchase from Elevate Digital!\n\nHere are your download links:\n\n${downloadList}\n\n💡 Save this email — you can re-download anytime using these links.\n\nIf you have any issues, reply to this email or visit our Contact page.\n\nHappy learning! 🚀\n— Team Elevate Digital`
                    })
                  }).catch(err => console.error('Email delivery error:', err));
                }

                cart = [];
                updateCartBadge();
                renderCart();
              } else {
                alert('Payment verification failed.');
              }
            } catch (e) {
              console.error(e);
              alert('Payment verification error.');
            }
          },
          theme: { color: '#2563eb' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();

      } catch (err) {
        console.error(err);
        alert('Payment gateway error. Please try again later.');
      } finally {
        checkoutBtn.innerText = 'Place Order & Pay';
        checkoutBtn.disabled = false;
      }
    });
  }

  // Close Success Modal
  const successModal = document.getElementById('success-modal');
  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if(e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        successModal.classList.remove('active');
        navigateTo('page-home');
      }
    });
  }
});

function showSuccessModal(downloads) {
  const container = document.getElementById('download-links-container');
  const modal = document.getElementById('success-modal');
  if(!container || !modal) return;
  
  container.innerHTML = '';
  downloads.forEach(dl => {
    const btn = document.createElement('a');
    btn.href = dl.url;
    btn.className = 'btn btn-primary';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.gap = '0.5rem';
    btn.target = '_blank';
    btn.innerHTML = `<i class="fa-solid fa-download"></i> Download: ${dl.name}`;
    container.appendChild(btn);
  });
  
  modal.classList.add('active');
}


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
  const countdownSection = document.querySelector('.countdown');

  if (!hoursEl) return;

  // Use a fixed campaign end date: 48 hours from FIRST visit only
  // Once expired, it stays expired — no sneaky resets
  let expiryTime = localStorage.getItem('earnSmartBundleExpiry');
  const now = new Date().getTime();

  if (!expiryTime) {
    // First-time visitor: set 48 hours from now
    expiryTime = now + (48 * 60 * 60 * 1000);
    localStorage.setItem('earnSmartBundleExpiry', expiryTime.toString());
  } else {
    expiryTime = parseInt(expiryTime);
  }

  // If already expired, hide countdown and show "Limited time offer" text
  if (now > expiryTime) {
    if (countdownSection) countdownSection.style.display = 'none';
    return;
  }

  setInterval(() => {
    const currentTime = new Date().getTime();
    const distance = expiryTime - currentTime;

    if (distance < 0) {
      // Offer expired — hide countdown, don't reset
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

// ==== CONTACT FORM (Web3Forms) ====
function initContactForm() {
  const contactBtn = document.getElementById('contact-form-btn');
  if (!contactBtn) return;

  contactBtn.addEventListener('click', async () => {
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value.trim();

    // Validation
    if (!name || !email || !message) {
      showToast('Please fill in all fields.');
      return;
    }

    // Loading state
    contactBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    contactBtn.disabled = true;

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'a5859d2b-95fc-4352-a7be-479f80955f70',
          name: name,
          email: email,
          subject: `[EarnSmart] ${subject}`,
          message: message,
          from_name: 'EarnSmart Website'
        })
      });

      const data = await res.json();

      if (data.success) {
        showToast('Message sent successfully! We\'ll reply within 4 hours.');
        // Clear the form
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-subject').selectedIndex = 0;
        document.getElementById('contact-message').value = '';
      } else {
        showToast('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showToast('Something went wrong. Please try again later.');
    } finally {
      contactBtn.innerHTML = 'Send Message';
      contactBtn.disabled = false;
    }
  });
}

// ==== HERO PARTICLES ====
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const colors = [
    'rgba(255, 107, 43, 0.4)',
    'rgba(167, 139, 250, 0.3)',
    'rgba(16, 185, 129, 0.3)',
    'rgba(251, 191, 36, 0.3)',
    'rgba(255, 255, 255, 0.15)'
  ];

  function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');

    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(particle);

    // Remove after animation completes to avoid DOM bloat
    setTimeout(() => {
      particle.remove();
      createParticle(); // Recreate
    }, (duration + delay) * 1000);
  }

  // Create initial batch
  for (let i = 0; i < 25; i++) {
    createParticle();
  }
}

// ==== ANIMATED STATS COUNTER ====
function initStatsCounter() {
  const statNums = document.querySelectorAll('.hero-stat-num');
  if (statNums.length === 0) return;

  function animateCounters() {
    statNums.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'));
      const duration = 2000;
      const startTime = performance.now();

      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
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

  // Fire immediately since the home page is active on load
  // Also use IntersectionObserver as backup for SPA navigation
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    // Immediate trigger with small delay for DOM readiness
    setTimeout(animateCounters, 500);

    // Also observe for re-visits via SPA navigation
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

// ==== SOCIAL PROOF CYCLING ====
function initSocialProofCycle() {
  const proofEl = document.getElementById('hero-social-proof');
  if (!proofEl) return;

  const buyers = [
    { initials: 'NK', name: 'Nisha K.', product: 'the Bundle', time: '2 min ago' },
    { initials: 'AM', name: 'Arjun M.', product: 'AI Tools Guide', time: '4 min ago' },
    { initials: 'SB', name: 'Sanya B.', product: 'Freelancing Guide', time: '7 min ago' },
    { initials: 'RV', name: 'Rohan V.', product: 'the Bundle', time: '11 min ago' },
    { initials: 'MJ', name: 'Meera J.', product: 'Trading Guide', time: '14 min ago' },
    { initials: 'KR', name: 'Karthik R.', product: 'Dropshipping Guide', time: '18 min ago' },
    { initials: 'TP', name: 'Tanvi P.', product: 'the Bundle', time: '22 min ago' },
    { initials: 'HD', name: 'Harsh D.', product: 'AI Tools Guide', time: '25 min ago' }
  ];

  let currentIndex = 0;

  function showProof() {
    const buyer = buyers[currentIndex];
    proofEl.querySelector('.hero-proof-avatar').textContent = buyer.initials;
    proofEl.querySelector('strong').textContent = buyer.name;
    proofEl.querySelector('strong').nextSibling.textContent = ` just bought ${buyer.product}`;
    proofEl.querySelector('.hero-proof-time').textContent = buyer.time;

    // Reset animation
    proofEl.style.animation = 'none';
    proofEl.offsetHeight; // trigger reflow
    proofEl.style.animation = 'proofSlideIn 0.5s ease-out forwards';

    // Hide after 5 seconds
    setTimeout(() => {
      proofEl.style.animation = 'proofSlideOut 0.5s ease-in forwards';
    }, 5000);

    currentIndex = (currentIndex + 1) % buyers.length;
  }

  // First show after 3 seconds, then every 12 seconds
  setTimeout(() => {
    showProof();
    setInterval(showProof, 12000);
  }, 3000);
}
