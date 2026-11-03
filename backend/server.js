
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pi-bike-insure')
  .then(()=> console.log('MongoDB connected'))
  .catch(e=> console.log('Mongo error', e.message));

// Routes
app.use('/api/pi', require('./routes/pi-payments'));
app.use('/api/turtlemint', require('./routes/turtlemint'));
app.use('/api/payment', require('./routes/razorpay'));

app.get('/', (req,res)=> res.json({ status: 'Pi Bike Insure Backend Running', gcv_rate: process.env.GCV_INR_RATE }));

app.listen(process.env.PORT || 5000, ()=> console.log('Backend on 5000'));
