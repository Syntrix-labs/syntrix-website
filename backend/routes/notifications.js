const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetch notifications for this user, newest first
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Security: ensure the notification belongs to the user trying to read it
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Update Notification Error:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// @route   POST /api/notifications (FOR TESTING ONLY)
// @desc    Manually trigger a notification to test the UI
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newNotification = new Notification({
      user: req.user.id,
      message: req.body.message,
      type: req.body.type || 'System'
    });

    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({ message: 'Server error creating notification' });
  }
});

module.exports = router;