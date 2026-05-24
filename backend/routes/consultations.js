const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  const messages = await Consultation.find({ client: req.user.id }).sort({ createdAt: 1 });
  res.json(messages);
});

router.get('/admin/:clientId', authMiddleware, async (req, res) => {
  const messages = await Consultation.find({ client: req.params.clientId }).sort({ createdAt: 1 });
  res.json(messages);
});

router.get('/admin/all', authMiddleware, async (req, res) => {
  const messages = await Consultation.find()
    .populate('client', 'name email')
    .sort({ createdAt: -1 });
  res.json(messages);
});

router.post('/', authMiddleware, async (req, res) => {
  const message = await Consultation.create({
    client: req.body.client || req.user.id,
    senderRole: req.body.senderRole || 'Client',
    message: req.body.message
  });
  res.status(201).json({ success: true, message });
});

module.exports = router;
