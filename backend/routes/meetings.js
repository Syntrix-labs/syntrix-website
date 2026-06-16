const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const authMiddleware = require('../middleware/authMiddleware');
const requireStaff = require('../middleware/staffMiddleware');

const normalizeAssignees = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean))]
    : undefined;

router.get('/', authMiddleware, async (req, res) => {
  const meetings = await Meeting.find({ client: req.user.id }).sort({ date: 1, time: 1 });
  res.json(meetings);
});

// Client meetings the signed-in team member was invited to join.
// Admins see every meeting here too (they can always join).
router.get('/assigned', authMiddleware, requireStaff, async (req, res) => {
  const query = req.staff.isAdmin ? {} : { assignees: req.staff.email };
  const meetings = await Meeting.find(query)
    .populate('client', 'name email')
    .sort({ date: 1, time: 1 });
  res.json(meetings);
});

router.post('/book', authMiddleware, async (req, res) => {
  const meeting = await Meeting.create({
    client: req.user.id,
    title: req.body.title || 'Client consultation',
    date: req.body.date,
    time: req.body.time,
    timezone: req.body.timezone || 'Asia/Kolkata',
    status: 'Requested',
    notes: req.body.notes
  });
  res.status(201).json({ success: true, meeting });
});

router.post('/', authMiddleware, requireStaff, async (req, res) => {
  const meeting = await Meeting.create({
    client: req.body.client || req.user.id,
    title: req.body.title || 'Client consultation',
    date: req.body.date,
    time: req.body.time,
    timezone: req.body.timezone || 'Asia/Kolkata',
    status: req.body.status || 'Confirmed',
    meetingLink: req.body.meetingLink,
    meetingPlatform: req.body.meetingPlatform || 'Google Meet',
    notes: req.body.notes,
    assignees: normalizeAssignees(req.body.assignees) || []
  });
  res.status(201).json({ success: true, meeting });
});

router.get('/admin/all', authMiddleware, requireStaff, async (req, res) => {
  const meetings = await Meeting.find().populate('client', 'name email').sort({ createdAt: -1 });
  res.json(meetings);
});

router.put('/:id', authMiddleware, requireStaff, async (req, res) => {
  const updates = { ...req.body };
  if (updates.assignees !== undefined) {
    updates.assignees = normalizeAssignees(updates.assignees) || [];
  }
  if (updates.status === 'Confirmed' && !updates.meetingLink) {
    updates.meetingLink = 'Admin will share the meeting link soon';
  }
  const meeting = await Meeting.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ success: true, meeting });
});

module.exports = router;
