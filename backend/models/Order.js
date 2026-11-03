
const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
  pi_uid: String,
  pi_username: String,
  wallet_address: String,
  vehicle_number: String,
  vehicle_details: Object,
  quote: Object,
  total_premium: Number,
  pi_amount: Number,
  pi_share_inr: Number,
  inr_share: Number,
  gcv_rate: Number,
  pi_tx_id: String,
  pi_payment_id: String,
  pi_status: { type: String, enum: ['PENDING','PAID','FAILED'], default: 'PENDING' },
  razorpay_order_id: String,
  razorpay_payment_id: String,
  inr_status: { type: String, enum: ['PENDING','PAID','FAILED'], default: 'PENDING' },
  policy_status: { type: String, enum: ['PENDING','ISSUED','FAILED'], default: 'PENDING' },
  policy_pdf_url: String,
  merchant_wallet: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Order', OrderSchema);
