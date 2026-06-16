const User = require('../models/User');
const { isAdminEmail } = require('../utils/adminAccess');

/**
 * Allows admins (email in ADMIN_EMAILS) and team members (role 'team').
 * Use for endpoints shared by the admin panel and the limited team view:
 * consultation, client meetings, and team meetings.
 */
module.exports = async function requireStaff(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id).select('email role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const admin = isAdminEmail(user.email);
    if (admin || user.role === 'team') {
      req.staff = { id: user.id, email: user.email, isAdmin: admin };
      return next();
    }

    return res.status(403).json({ success: false, message: 'Staff access required' });
  } catch (error) {
    console.error('Staff Check Error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking access' });
  }
};
