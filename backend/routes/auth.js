const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Import the middleware
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ success: true, message: 'User registered successfully!' });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ success: true, token });
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
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user with that email' });
    }

    // 1. Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash it and save it to the database with an expiration (e.g., 10 minutes)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 3. Create the reset URL (Tahir will build this frontend page later)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

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
      text: `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`
    };

    await transporter.sendMail(message);
    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (error) {
    console.error(error);
    // If it fails, clear the token fields so they can try again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ success: false, message: 'Email could not be sent' });
  }
});

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password using token
router.put('/reset-password/:token', async (req, res) => {
  try {
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