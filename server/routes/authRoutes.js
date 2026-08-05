const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, phone: user.phone, name: user.name },
    process.env.JWT_SECRET || 'super_secret_exam_platform_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new student or teacher account using Mobile Number or Email
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, rollNumber, department } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, message: 'Name and password are required.' });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Either Email Address or Mobile Number is required.' });
    }

    // Clean inputs
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim() : null;

    // Check for existing account by email or phone
    const queryConditions = [];
    if (cleanEmail) queryConditions.push({ email: cleanEmail });
    if (cleanPhone) queryConditions.push({ phone: cleanPhone });

    if (queryConditions.length > 0) {
      const existingUser = await User.findOne({ $or: queryConditions });
      if (existingUser) {
        if (cleanEmail && existingUser.email === cleanEmail) {
          return res.status(400).json({ success: false, message: 'An account with this Email Address already exists.' });
        }
        if (cleanPhone && existingUser.phone === cleanPhone) {
          return res.status(400).json({ success: false, message: 'An account with this Mobile Number already exists.' });
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: userRole,
      rollNumber: rollNumber || '',
      department: department || '',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: `${userRole === 'admin' ? 'Teacher' : 'Student'} registration successful!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login for students & admins using Email OR Mobile Number
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Mobile Number/Email and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Search by email OR phone number
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier.trim() },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Mobile Number/Email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Mobile Number/Email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged-in user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
