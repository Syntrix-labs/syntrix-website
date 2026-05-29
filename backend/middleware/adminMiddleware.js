const User = require('../models/User');
const { isAdminEmail } = require('../utils/adminAccess');

module.exports = async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id).select('email');

    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = { id: user.id, email: user.email };
    return next();
  } catch (error) {
    console.error('Admin Check Error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking admin access' });
  }
};
