
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if(!order) return res.status(404).json({ error: 'Order not found' });

  const options = {
    amount: order.inr_share * 100, // in paise
    currency: 'INR',
    receipt: `receipt_${orderId}`,
  };

  try {
    const rzpOrder = await razorpay.orders.create(options);
    order.razorpay_order_id = rzpOrder.id;
    await order.save();
    res.json({ rzpOrderId: rzpOrder.id, amount: order.inr_share, key: process.env.RAZORPAY_KEY_ID });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

  if(expectedSignature === razorpay_signature){
    await Order.findByIdAndUpdate(orderId, { razorpay_payment_id, inr_status: 'PAID' });
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false });
  }
});

module.exports = router;
