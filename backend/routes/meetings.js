const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const authMiddleware = require('../middleware/authMiddleware');
const requireStaff = require('../middleware/staffMiddleware');
const mongoose = require('mongoose');
const User = require('../models/User');
const { isAdminEmail } = require('../utils/adminAccess');
const { canSeeClient } = require('../utils/teamScope');
const { announceMeeting } = require('../utils/meetingNotice');

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

// Staff arrange a meeting with a client; the client is told right away
// (chat message + push, one email with an "Add to Google Calendar" link).
router.post('/', authMiddleware, requireStaff, async (req, res) => {
  const clientId = req.body.client;
  if (!clientId || !mongoose.isValidObjectId(clientId)) {
    return res.status(400).json({ success: false, message: 'Choose a client for this meeting.' });
  }
  const client = await User.findById(clientId).select('name email role');
  if (!client || client.role === 'team' || isAdminEmail(client.email)) {
    return res.status(404).json({ success: false, message: 'Client not found.' });
  }
  if (!(await canSeeClient(req.staff, clientId))) {
    return res.status(403).json({ success: false, message: "You can only arrange meetings with clients whose projects you're assigned to." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.date || '')) || !/^\d{2}:\d{2}$/.test(String(req.body.time || ''))) {
    return res.status(400).json({ success: false, message: 'Pick a date and time.' });
  }

  const meeting = await Meeting.create({
    client: clientId,
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

  const scheduler = await User.findById(req.user.id).select('name email');
  let emailed = false;
  try {
    ({ emailed } = await announceMeeting({ io: req.app.get('io'), meeting, client, scheduler }));
  } catch (error) {
    console.error('Meeting notice failed:', error.message);
  }
  await meeting.populate('client', 'name email');
  res.status(201).json({ success: true, meeting, emailed });
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
