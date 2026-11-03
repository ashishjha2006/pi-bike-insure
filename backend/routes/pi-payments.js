
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Order = require('../models/Order');
const { calculateSplit } = require('../utils/calc');

const PI_API = 'https://api.minepi.com';
const PI_API_SANDBOX = 'https://api.testnet.minepi.com';

// Approve payment - called from frontend onReadyForServerApproval
router.post('/approve', async (req, res) => {
  const { paymentId, orderId } = req.body;
  try {
    const apiUrl = process.env.PI_SANDBOX === 'true' ? PI_API_SANDBOX : PI_API;
    await axios.post(`${apiUrl}/v2/payments/${paymentId}/approve`, {}, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
    });
    console.log('Pi Payment Approved:', paymentId);
    res.json({ approved: true });
  } catch (e) {
    console.error('Approve failed', e.response?.data || e.message);
    res.status(500).json({ error: 'Approve failed' });
  }
});

// Complete payment - called from frontend onReadyForServerCompletion
router.post('/complete', async (req, res) => {
  const { paymentId, txid, orderId } = req.body;
  try {
    const apiUrl = process.env.PI_SANDBOX === 'true' ? PI_API_SANDBOX : PI_API;
    await axios.post(`${apiUrl}/v2/payments/${paymentId}/complete`, { txid }, {
      headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
    });

    // Update order
    if(orderId){
      await Order.findByIdAndUpdate(orderId, {
        pi_tx_id: txid,
        pi_payment_id: paymentId,
        pi_status: 'PAID',
        merchant_wallet: process.env.PI_MERCHANT_WALLET_ADDRESS
      });
    }

    console.log('Pi Payment Completed:', paymentId, txid);
    res.json({ completed: true, txid });
  } catch (e) {
    console.error('Complete failed', e.response?.data || e.message);
    res.status(500).json({ error: 'Complete failed' });
  }
});

// Create order and calculate split
router.post('/create-order', async (req, res) => {
  const { totalPremium, vehicleNumber, vehicleDetails, quote, piUser } = req.body;
  const split = calculateSplit(totalPremium);

  const order = new Order({
    pi_uid: piUser?.uid,
    pi_username: piUser?.username,
    wallet_address: piUser?.wallet_address,
    vehicle_number: vehicleNumber,
    vehicle_details: vehicleDetails,
    quote: quote,
    total_premium: totalPremium,
    pi_amount: split.piAmount,
    pi_share_inr: split.piShareInr,
    inr_share: split.inrShare,
    gcv_rate: split.gcvRate,
    merchant_wallet: process.env.PI_MERCHANT_WALLET_ADDRESS
  });
  await order.save();
  res.json({ orderId: order._id, split });
});

module.exports = router;
