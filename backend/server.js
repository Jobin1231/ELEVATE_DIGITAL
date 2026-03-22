require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to call backend

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Mock Products Database (Source of Truth for Prices)
const products = {
  1: { price: 199 },
  2: { price: 199 },
  3: { price: 199 },
  4: { price: 199 },
  5: { price: 199 },
  6: { price: 399 }
};

// Route: Create Order
app.post('/create-order', async (req, res) => {
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

    const options = {
      amount: totalInRupees * 100, // Razorpay takes amount in paise (1 INR = 100 paise)
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
app.post('/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Cryptographic signature verification
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment holds true, deliver the files!
      res.json({
        success: true,
        message: 'Payment verified successfully!',
        downloads: [
          { name: 'Your Premium Guides', url: '#secure-download-link' }
        ]
      });
    } else {
      res.status(400).json({ success: false, error: 'Payment signature invalid' });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
