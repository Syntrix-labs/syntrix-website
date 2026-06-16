const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Import the middleware
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { isAdminEmail } = require('../utils/adminAccess');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireString(value, field, min = 1, max = 200) {
  if (typeof value !== 'string') {
    return `${field} is required.`;
  }

  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${field} is required.`;
  }

  if (trimmed.length > max) {
    return `${field} is too long.`;
  }

  return null;
}

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : undefined;
    const company = typeof req.body.company === 'string' ? req.body.company.trim() : undefined;

    const validationError = requireString(name, 'Name', 2, 100)
      || (!isValidEmail(email) ? 'Enter a valid email address.' : null)
      || requireString(password, 'Password', 8, 128);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      company
    });

    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      isAdmin: isAdminEmail(user.email),
      isTeam: user.role === 'team'
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', authLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!isValidEmail(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ success: true, token, isAdmin: isAdminEmail(user.email), isTeam: user.role === 'team' });
      }
    );

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get logged in user data (Protected Route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user comes from the decoded token in your middleware
    const user = await User.findById(req.user.id).select('-password'); 
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObject = user.toObject();
    res.json({ ...userObject, isAdmin: isAdminEmail(user.email), isTeam: user.role === 'team' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/profile/request-otp', authMiddleware, passwordResetLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.emailOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.emailOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `${process.env.EMAIL_USER}`,
        to: typeof req.body.email === 'string' && isValidEmail(normalizeEmail(req.body.email)) ? normalizeEmail(req.body.email) : user.email,
        subject: 'Syntrix Labs - Profile verification OTP',
        text: `Your Syntrix profile verification OTP is: ${otp}`
      });
    }

    res.json({
      success: true,
      message: process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'OTP sent to email' : 'OTP generated. Configure email credentials to send it automatically.',
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    console.error('Profile OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error sending OTP' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'company'];
    const updates = {};
    allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (updates.email && updates.email !== existingUser.email) {
      const hashedOtp = crypto.createHash('sha256').update(req.body.otp || '').digest('hex');
      if (!existingUser.emailOtp || existingUser.emailOtp !== hashedOtp || existingUser.emailOtpExpire < Date.now()) {
        return res.status(400).json({ success: false, message: 'Valid email OTP is required to change email' });
      }
      updates.emailOtp = undefined;
      updates.emailOtpExpire = undefined;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    const userObject = user.toObject();
    res.json({ success: true, user: { ...userObject, isAdmin: isAdminEmail(user.email) } });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  let user;

  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash it and save it to the database with an expiration (e.g., 10 minutes)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 3. Create the reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl.split(',')[0]}/reset-password/${resetToken}`;

    // 4. Configure Nodemailer to send the email
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // We will configure this in your .env
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const message = {
      from: `${process.env.EMAIL_USER}`,
      to: user.email,
      subject: 'Syntrix Labs - Password Reset',
      text: `You requested a password reset. Open this link to set a new password:\n\n${resetUrl}`
    };

    await transporter.sendMail(message);
    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (error) {
    console.error(error);
    // If it fails, clear the token fields so they can try again
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
    }
    res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password using token
router.put('/reset-password/:token', async (req, res) => {
  try {
    if (typeof req.body.password !== 'string' || req.body.password.length < 8 || req.body.password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be 8 to 128 characters' });
    }

    // 1. Get the hashed version of the token from the URL
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // 2. Find the user with that token IF the token hasn't expired yet
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // 3. Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // 4. Clear the temporary reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
