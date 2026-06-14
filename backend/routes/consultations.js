const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const { isAdminEmail } = require('../utils/adminAccess');

router.get('/', authMiddleware, async (req, res) => {
  const messages = await Consultation.find({ client: req.user.id }).sort({ createdAt: 1 });
  res.json(messages);
});

router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  const messages = await Consultation.find()
    .populate('client', 'name email')
    .sort({ createdAt: -1 });
  res.json(messages);
});

router.get('/admin/:clientId', authMiddleware, requireAdmin, async (req, res) => {
  const messages = await Consultation.find({ client: req.params.clientId }).sort({ createdAt: 1 });
  res.json(messages);
});

// Two-way: admins post to a specified client's thread as "Admin"; clients
// post to their own thread as "Client" (sender role is enforced server-side).
router.post('/', authMiddleware, async (req, res) => {
  const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!text) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const me = await User.findById(req.user.id).select('email');
  const admin = isAdminEmail(me?.email);

  const clientId = admin ? req.body.client : req.user.id;
  if (admin && !clientId) {
    return res.status(400).json({ success: false, message: 'Select a client to message' });
  }

  const message = await Consultation.create({
    client: clientId,
    senderRole: admin ? 'Admin' : 'Client',
    message: text,
  });
  res.status(201).json({ success: true, message });
});

module.exports = router;
