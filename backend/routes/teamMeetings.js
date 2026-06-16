const express = require('express');
const router = express.Router();
const TeamMeeting = require('../models/TeamMeeting');
const authMiddleware = require('../middleware/authMiddleware');
const requireStaff = require('../middleware/staffMiddleware');

router.get('/', authMiddleware, requireStaff, async (req, res) => {
  const meetings = await TeamMeeting.find().sort({ date: 1, time: 1 });
  res.json(meetings);
});

router.post('/', authMiddleware, requireStaff, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title || !req.body.date || !req.body.time) {
    return res.status(400).json({ success: false, message: 'Title, date and time are required' });
  }
  const meeting = await TeamMeeting.create({
    title,
    date: req.body.date,
    time: req.body.time,
    agenda: req.body.agenda,
    attendees: Array.isArray(req.body.attendees) ? req.body.attendees : [],
    link: req.body.link
  });
  res.status(201).json({ success: true, meeting });
});

router.delete('/:id', authMiddleware, requireStaff, async (req, res) => {
  await TeamMeeting.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
