const express = require('express');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Enforce admin middleware for all routes in this router
router.use(verifyToken);
router.use(verifyAdmin);

// @route   GET /api/admin/stats
// @desc    Get dashboard overview statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalExams = await Exam.countDocuments();
    const totalSubmissions = await Result.countDocuments({ status: { $in: ['submitted', 'auto_submitted'] } });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      success: true,
      stats: {
        totalTeachers,
        totalStudents,
        totalExams,
        totalSubmissions,
        recentSignups,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/teachers
// @desc    Get list of all teachers with search and filter
router.get('/teachers', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { role: 'teacher' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { department: searchRegex },
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const teachers = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({ success: true, count: teachers.length, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/students
// @desc    Get list of all students with search and filter
router.get('/students', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { role: 'student' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { rollNumber: searchRegex },
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const students = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/admin/users/:id/toggle-status
// @desc    Activate or deactivate user account
router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Super-admin account status cannot be altered.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Super-admin account cannot be deleted.' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
