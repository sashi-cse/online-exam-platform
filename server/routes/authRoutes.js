const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { verifyToken, getJwtSecret } = require('../middleware/auth');
const { generateOtpCode, sendOtpNotification, normalizePhoneNumber } = require('../utils/otpService');

const router = express.Router();

// Rate limiter: Max 10 OTP requests per 15 minutes per IP
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, phone: user.phone, name: user.name },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

const sendAuthResponse = (res, user, message = 'Authentication successful!') => {
  const token = generateToken(user);

  // Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || user.mobileNumber,
      mobileNumber: user.mobileNumber || user.phone,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
      isVerified: user.isVerified,
      isActive: user.isActive,
      authProvider: user.authProvider,
    },
  });
};

// @route   GET /api/auth/config
// @desc    Get public auth config (Google Client ID)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// @route   POST /api/auth/google
// @desc    Authenticate or Register via Google OAuth 2.0
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ success: false, message: 'GOOGLE_CLIENT_ID is not configured in server environment.' });
    }

    const googleClient = new OAuth2Client(googleClientId);

    let email = null;
    let name = null;
    let googleId = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      email = payload.email ? payload.email.toLowerCase().trim() : null;
      name = payload.name;
      googleId = payload.sub;
    } catch (verErr) {
      console.error('❌ Google Token Verification Error:', verErr.message);
      return res.status(401).json({
        success: false,
        message: `Google OAuth verification failed: ${verErr.message}`,
      });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google profile did not contain a valid email address.' });
    }

    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    const targetRole = role === 'teacher' || role === 'admin' ? role : 'student';

    if (user) {
      // Existing User
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact your administrator.' });
      }

      // Admin Tab Check for existing Google users
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'This Google account does not have Super Admin privileges.' });
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.isVerified = true;
      await user.save();

      return sendAuthResponse(res, user, `Welcome back, ${user.name}! Signed in with Google.`);
    }

    // New Google Sign-Up
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@school.com').toLowerCase().trim();

    if (targetRole === 'admin') {
      if (email !== adminEmail) {
        return res.status(403).json({
          success: false,
          message: 'Google Sign-Up is disabled for Admin portal. Only pre-seeded Admin accounts can sign in.',
        });
      }
    }

    const assignedRole = targetRole === 'admin' && email === adminEmail ? 'admin' : (targetRole === 'teacher' ? 'teacher' : 'student');

    user = await User.create({
      name: name || email.split('@')[0],
      email,
      authProvider: 'google',
      googleId,
      role: assignedRole,
      isVerified: true,
      isActive: true,
    });

    return sendAuthResponse(res, user, `Account created successfully with Google! Logged in as ${assignedRole}.`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Generate and send 6-digit OTP to Mobile or Email via real transactional provider
router.post('/send-otp', otpRateLimiter, async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Mobile Number or Email Address is required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const isEmail = cleanIdentifier.includes('@');

    const rawOtp = generateOtpCode();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.deleteMany({ identifier: cleanIdentifier });
    await Otp.create({
      identifier: cleanIdentifier,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
    });

    // Real delivery call — throws error if configuration or provider fails
    await sendOtpNotification(cleanIdentifier, rawOtp, isEmail);

    res.json({
      success: true,
      message: `A 6-digit OTP code has been sent to ${cleanIdentifier}.`,
      expiresInSeconds: 600,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to send OTP code. Please verify identifier or provider credentials.',
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify 6-digit OTP code
router.post('/verify-otp', async (req, res) => {
  try {
    const { identifier, otpCode, role } = req.body;

    if (!identifier || !otpCode) {
      return res.status(400).json({ success: false, message: 'Mobile/Email and OTP code are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const otpRecord = await Otp.findOne({ identifier: cleanIdentifier });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otpCode.trim(), otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: `Invalid OTP code. ${5 - otpRecord.attempts} attempts remaining.` });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    const normalized = normalizePhoneNumber(identifier);
    let user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier.trim() },
        { phone: normalized },
        { mobileNumber: identifier.trim() },
        { mobileNumber: normalized },
      ],
    });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact your administrator.',
        });
      }

      if (role && user.role !== role) {
        const userRoleLabel = user.role === 'admin' ? 'Super Admin' : user.role === 'teacher' ? 'Teacher' : 'Student';
        return res.status(400).json({
          success: false,
          message: `This account is registered as a ${userRoleLabel}. Please switch to the ${userRoleLabel} portal tab.`,
        });
      }

      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      return sendAuthResponse(res, user, 'OTP verified successfully!');
    }

    res.json({ success: true, message: 'OTP verified successfully! You may now complete account registration.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new student or teacher account
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, mobileNumber, password, role, rollNumber, department } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required.' });
    }

    const inputPhone = phone || mobileNumber;
    if (!email && !inputPhone) {
      return res.status(400).json({ success: false, message: 'Either Email Address or Mobile Number is required.' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = inputPhone ? inputPhone.trim() : null;
    const normalizedPhone = cleanPhone ? normalizePhoneNumber(cleanPhone) : null;

    const queryConditions = [];
    if (cleanEmail) queryConditions.push({ email: cleanEmail });
    if (cleanPhone) {
      queryConditions.push({ phone: cleanPhone });
      queryConditions.push({ mobileNumber: cleanPhone });
    }
    if (normalizedPhone) {
      queryConditions.push({ phone: normalizedPhone });
      queryConditions.push({ mobileNumber: normalizedPhone });
    }

    if (queryConditions.length > 0) {
      const existingUser = await User.findOne({ $or: queryConditions });
      if (existingUser) {
        if (cleanEmail && existingUser.email === cleanEmail) {
          return res.status(400).json({ success: false, message: 'An account with this Email Address already exists.' });
        }
        if (cleanPhone && (existingUser.phone === cleanPhone || existingUser.mobileNumber === cleanPhone || existingUser.phone === normalizedPhone)) {
          return res.status(400).json({ success: false, message: 'An account with this Mobile Number already exists.' });
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role === 'teacher' || role === 'admin' ? 'teacher' : 'student';

    const user = await User.create({
      name,
      email: cleanEmail,
      phone: normalizedPhone || cleanPhone,
      mobileNumber: normalizedPhone || cleanPhone,
      password: hashedPassword,
      authProvider: 'local',
      role: userRole,
      isVerified: false,
      rollNumber: rollNumber || '',
      department: department || '',
    });

    const identifier = cleanEmail || cleanPhone;
    const rawOtp = generateOtpCode();
    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, otpSalt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.deleteMany({ identifier });
    await Otp.create({
      identifier,
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
    });

    await sendOtpNotification(identifier, rawOtp, Boolean(cleanEmail));

    res.status(201).json({
      success: true,
      requiresOtp: true,
      message: `${userRole === 'teacher' ? 'Teacher' : 'Student'} account created! An OTP code was sent to ${identifier}.`,
      identifier,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Email Address or Mobile Number already exists.',
      });
    }
    res.status(400).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// @route   POST /api/auth/login-password
// @desc    Password-based login
router.post('/login-password', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Mobile Number and Password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const normalized = normalizePhoneNumber(identifier);

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier.trim() },
        { phone: normalized },
        { mobileNumber: identifier.trim() },
        { mobileNumber: normalized },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found. Please check your credentials or register.' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your administrator.',
      });
    }

    if (role && user.role !== role) {
      const userRoleLabel = user.role === 'admin' ? 'Super Admin' : user.role === 'teacher' ? 'Teacher' : 'Student';
      return res.status(400).json({
        success: false,
        message: `This account is registered as a ${userRoleLabel}. Please switch to the ${userRoleLabel} portal tab.`,
      });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please click "Continue with Google".',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requiresOtp: true,
        identifier: cleanIdentifier,
        message: 'Account is unverified. An OTP code is required to complete verification.',
      });
    }

    return sendAuthResponse(res, user, 'Login successful!');
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// @route   GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || req.user.mobileNumber,
        mobileNumber: req.user.mobileNumber || req.user.phone,
        role: req.user.role,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
        isVerified: req.user.isVerified,
        isActive: req.user.isActive,
        authProvider: req.user.authProvider,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
