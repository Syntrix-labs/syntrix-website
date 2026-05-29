const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  const payments = await Payment.find({ client: req.user.id }).sort({ createdAt: -1 });
  res.json(payments);
});

router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  const payments = await Payment.find().populate('client', 'name email').populate('project', 'title').sort({ createdAt: -1 });
  res.json(payments);
});

router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const body = { ...req.body };
  if (body.clientEmail && !body.client) {
    const client = await User.findOne({ email: body.clientEmail });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client email not found' });
    }
    body.client = client._id;
  }
  if (!body.client) {
    body.client = req.user.id;
  }
  if (!body.provider) {
    body.provider = body.paymentUrl ? 'Razorpay' : 'Manual';
  }
  if (!body.currency) {
    body.currency = 'INR';
  }
  const payment = await Payment.create(body);
  res.status(201).json({ success: true, payment });
});

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, payment });
});

module.exports = router;
