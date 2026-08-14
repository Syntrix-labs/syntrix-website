const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Import the middleware
const crypto = require('crypto');
const { sendMail } = require('../utils/mailer');
const { isAdminEmail, isMarketingHeadEmail } = require('../utils/adminAccess');
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
      isTeam: user.role === 'team',
      isMarketingHead: isMarketingHeadEmail(user.email)
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
        res.json({ success: true, token, isAdmin: isAdminEmail(user.email), isTeam: user.role === 'team', isMarketingHead: isMarketingHeadEmail(user.email) });
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
    res.json({ ...userObject, isAdmin: isAdminEmail(user.email), isTeam: user.role === 'team', isMarketingHead: isMarketingHeadEmail(user.email) });
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

    let otpSent = false;
    try {
      otpSent = await sendMail({
        to: typeof req.body.email === 'string' && isValidEmail(normalizeEmail(req.body.email)) ? normalizeEmail(req.body.email) : user.email,
        subject: 'Syntrix Labs - Profile verification OTP',
        text: `Your Syntrix profile verification OTP is: ${otp}`
      });
    } catch (mailError) {
      console.error('OTP email failed:', mailError.message);
    }

    res.json({
      success: true,
      message: otpSent ? 'OTP sent to email' : 'OTP generated. Configure email to send it automatically.',
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

    // 4. Send the reset email (HTTPS provider on Render, SMTP fallback locally)
    const sent = await sendMail({
      to: user.email,
      subject: 'Syntrix Labs - Password Reset',
      text: `You requested a password reset. Open this link to set a new password:\n\n${resetUrl}`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to set a new password</a></p><p>Or open: ${resetUrl}</p>`
    });
    if (!sent) {
      throw new Error('Email provider not configured');
    }
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

// ------------------- Social sign-in (OAuth 2.0 / OIDC) -------------------
// Google, GitHub, LinkedIn. Each provider stays dormant until its
// CLIENT_ID / CLIENT_SECRET env vars are set. Stateless CSRF via a signed
// `state` (JWT) — no cookies/sessions needed.
const OAUTH_PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    id: () => process.env.GOOGLE_CLIENT_ID,
    secret: () => process.env.GOOGLE_CLIENT_SECRET,
    profile: (u) => ({ email: u.email, name: u.name || u.given_name })
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
    id: () => process.env.GITHUB_CLIENT_ID,
    secret: () => process.env.GITHUB_CLIENT_SECRET,
    profile: (u) => ({ email: u.email, name: u.name || u.login })
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userUrl: 'https://api.linkedin.com/v2/userinfo',
    scope: 'openid profile email',
    id: () => process.env.LINKEDIN_CLIENT_ID,
    secret: () => process.env.LINKEDIN_CLIENT_SECRET,
    profile: (u) => ({ email: u.email, name: u.name })
  }
};

function appBaseUrl() {
  // Public origin the browser hits (used to build OAuth redirect URIs and the
  // post-login redirect). Prefer PUBLIC_APP_URL, else the first CLIENT_URL origin.
  return (process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')[0].trim().replace(/\/$/, '');
}
function oauthRedirectUri(provider) {
  return `${appBaseUrl()}/api/auth/oauth/${provider}/callback`;
}

// Which providers are actually configured (used by the frontend to show buttons).
router.get('/oauth/providers', (req, res) => {
  const enabled = Object.keys(OAUTH_PROVIDERS).filter((p) => OAUTH_PROVIDERS[p].id() && OAUTH_PROVIDERS[p].secret());
  res.json({ enabled });
});

// Step 1: kick off the OAuth flow — redirect the user to the provider.
router.get('/oauth/:provider', (req, res) => {
  const provider = req.params.provider;
  const cfg = OAUTH_PROVIDERS[provider];
  const base = appBaseUrl();
  if (!cfg) return res.redirect(`${base}/login?error=unknown_provider`);
  if (!cfg.id() || !cfg.secret()) return res.redirect(`${base}/login?error=${provider}_unavailable`);

  const state = jwt.sign({ p: provider, n: crypto.randomBytes(8).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '10m' });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.id(),
    redirect_uri: oauthRedirectUri(provider),
    scope: cfg.scope,
    state
  });
  res.redirect(`${cfg.authUrl}?${params.toString()}`);
});

// Step 2: handle the provider callback — exchange code, create/link user, issue our JWT.
router.get('/oauth/:provider/callback', async (req, res) => {
  const provider = req.params.provider;
  const cfg = OAUTH_PROVIDERS[provider];
  const base = appBaseUrl();
  const fail = (reason) => res.redirect(`${base}/login?error=${encodeURIComponent(reason)}`);

  try {
    if (!cfg) return fail('unknown_provider');
    const code = req.query.code;
    const state = req.query.state;
    if (!code || !state) return fail('missing_code');
    try {
      const decoded = jwt.verify(String(state), process.env.JWT_SECRET);
      if (decoded.p !== provider) return fail('bad_state');
    } catch (_) {
      return fail('bad_state');
    }

    // Exchange the authorization code for an access token.
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: oauthRedirectUri(provider),
        client_id: cfg.id(),
        client_secret: cfg.secret()
      })
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return fail('token_exchange_failed');

    // Fetch the user's profile.
    const uRes = await fetch(cfg.userUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'SyntrixLabs' }
    });
    const uJson = await uRes.json();
    let { email, name } = cfg.profile(uJson);

    // GitHub hides the email unless you ask the emails endpoint.
    if (!email && cfg.emailsUrl) {
      const eRes = await fetch(cfg.emailsUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'SyntrixLabs' }
      });
      const emails = await eRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
        email = primary && primary.email;
      }
    }

    email = normalizeEmail(email);
    if (!isValidEmail(email)) return fail('no_email');

    // Find or create — links to an existing email account if one exists.
    let user = await User.findOne({ email });
    if (!user) {
      const randomPw = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), await bcrypt.genSalt(10));
      user = await User.create({ name: name || email.split('@')[0], email, password: randomPw, provider });
    } else if (!user.provider) {
      user.provider = provider;
      await user.save();
    }

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.redirect(`${base}/oauth/callback?token=${token}`);
  } catch (err) {
    console.error('OAuth error:', err && err.message);
    return fail('oauth_error');
  }
});

module.exports = router;
