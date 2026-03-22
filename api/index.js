require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../')));

// Root Route explicitly for index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'active', message: 'EarnSmart Server is running' });
});

// Initialize Razorpay (Resilient to missing keys)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized successfully.');
} else {
  console.error('❌ ERROR: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing! Checkout will fail.');
}

// Mock Products Database
const products = {
  1: { price: 199, name: 'Freelancing & Digital Products', file: 'Guide_1_How_to_Start_Freelancing_Selling_Digital_Products_Online_in_India.pdf' },
  2: { price: 199, name: 'Dropshipping for Indians', file: 'Guide_2_Dropshipping_in_India.pdf' },
  3: { price: 199, name: 'Stock & Crypto Basics', file: 'Guide_3_Stock_Market_Crypto_Basics_for_Indian_Beginners.pdf' },
  4: { price: 199, name: 'Earning with AI Tools', file: 'Guide_4_How_to_Earn_Money_Using_AI_Tools_in_India.pdf' },
  5: { price: 199, name: 'Create & Sell Your Own Guide', file: 'Guide_5_How_to_Create_Sell_Your_Own_Digital_Guide_Online.pdf' },
  6: { price: 499, name: 'Complete Earn Online Bundle', isBundle: true }
};

// Route: Create Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { items } = req.body; 
    
    // Calculate total securely on backend
    let totalInRupees = 0;
    items.forEach(item => {
      if(products[item.id]) {
        totalInRupees += products[item.id].price * item.qty;
      }
    });

    if (totalInRupees === 0) {
      return res.status(400).json({ error: 'Cart is empty or invalid' });
    }

    if (!razorpay) {
      return res.status(500).json({ error: 'Payment gateway not configured on server.' });
    }

    const options = {
      amount: Math.round(totalInRupees * 100), // Razorpay takes amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Route: Verify Payment
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = req.body;

    // Cryptographic signature verification
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Build download list
      let downloads = [];
      const baseURL = process.env.SITE_URL || ''; // Set this in Vercel/Render env

      items.forEach(item => {
        const prod = products[item.id];
        if (prod) {
          if (prod.isBundle) {
            // Add all 5 guides
            for (let i = 1; i <= 5; i++) {
              downloads.push({ 
                name: products[i].name, 
                url: `${baseURL}/assets/guides/${products[i].file}` 
              });
            }
          } else {
            downloads.push({ 
              name: prod.name, 
              url: `${baseURL}/assets/guides/${prod.file}` 
            });
          }
        }
      });

      res.json({
        success: true,
        message: 'Payment verified successfully!',
        downloads: downloads
      });
    } else {
      res.status(400).json({ success: false, error: 'Payment signature invalid' });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
