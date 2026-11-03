
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// MOCK - Replace with real Turtlemint Partner API
const MOCK_QUOTES = [
  { company: 'HDFC Ergo', idv: 45000, premium: 1850, logo: 'https://logo.clearbit.com/hdfcergo.com' },
  { company: 'ICICI Lombard', idv: 46000, premium: 1920, logo: 'https://logo.clearbit.com/icicilombard.com' },
  { company: 'Bajaj Allianz', idv: 45500, premium: 1780, logo: 'https://logo.clearbit.com/bajajallianz.co.in' },
  { company: 'Digit Insurance', idv: 47000, premium: 1650, logo: 'https://logo.clearbit.com/godigit.com' },
];

router.post('/quotes', async (req, res) => {
  const { vehicleNumber, vehicleType } = req.body;
  // TODO: Call real Turtlemint API
  // const response = await axios.post('https://api.turtlemint.com/v1/two-wheeler/quotes', ...)

  // Simulate API delay
  await new Promise(r => setTimeout(r, 800));
  res.json({ vehicleNumber, quotes: MOCK_QUOTES });
});

router.post('/issue-policy', async (req, res) => {
  const { orderId, userDetails } = req.body;
  const order = await Order.findById(orderId);
  if(!order) return res.status(404).json({ error: 'Order not found' });
  if(order.pi_status !== 'PAID' || order.inr_status !== 'PAID') {
    return res.status(400).json({ error: 'Both Pi and INR payments must be completed' });
  }

  // TODO: Call Turtlemint issue API
  order.policy_status = 'ISSUED';
  order.policy_pdf_url = `https://example.com/policy/${orderId}.pdf`;
  await order.save();

  res.json({ success: true, policyUrl: order.policy_pdf_url, order });
});

module.exports = router;
