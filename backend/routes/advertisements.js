const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

router.get('/', async (req, res) => {
  const ads = await Advertisement.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json(ads);
});

router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const ad = await Advertisement.create(req.body);
  res.status(201).json({ success: true, advertisement: ad });
});

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, advertisement: ad });
});

router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  await Advertisement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
