const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  const members = await TeamMember.find().sort({ createdAt: -1 });
  res.json(members);
});

router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const member = await TeamMember.create({
    name: req.body.name,
    role: req.body.role,
    status: req.body.status || 'Active'
  });
  res.status(201).json({ success: true, member });
});

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, member });
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  await TeamMember.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
