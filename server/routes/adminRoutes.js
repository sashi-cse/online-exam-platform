const express = require('express');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
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
// @desc    Get list of all teachers with created exam counts
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
        { mobileNumber: searchRegex },
        { department: searchRegex },
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const teachers = await User.find(query).select('-password').sort({ createdAt: -1 });

    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const examCount = await Exam.countDocuments({ createdBy: teacher._id });
        return {
          ...teacher.toObject(),
          examCount,
        };
      })
    );

    res.json({ success: true, count: teachersWithDetails.length, teachers: teachersWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/teachers/:id
// @desc    Get teacher profile detail & created exams
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' }).select('-password');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    const exams = await Exam.find({ createdBy: teacher._id }).sort({ createdAt: -1 });
    res.json({ success: true, teacher, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/students
// @desc    Get list of all students with attempted exam stats
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
        { mobileNumber: searchRegex },
        { rollNumber: searchRegex },
      ];
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const students = await User.find(query).select('-password').sort({ createdAt: -1 });

    const studentsWithDetails = await Promise.all(
      students.map(async (student) => {
        const results = await Result.find({
          studentId: student._id,
          status: { $in: ['submitted', 'auto_submitted'] },
        });

        const attemptsCount = results.length;
        const avgScore = attemptsCount > 0
          ? (results.reduce((sum, r) => sum + r.score, 0) / attemptsCount).toFixed(2)
          : 0;

        return {
          ...student.toObject(),
          attemptsCount,
          avgScore: Number(avgScore),
        };
      })
    );

    res.json({ success: true, count: studentsWithDetails.length, students: studentsWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/students/:id
// @desc    Get student profile detail & past results
router.get('/students/:id', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const results = await Result.find({ studentId: student._id })
      .populate('examId', 'title subject bookletCode totalMarks')
      .sort({ createdAt: -1 });

    res.json({ success: true, student, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/exams
// @desc    Get all exams with teacher owner details and average score stats
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name email phone department')
      .sort({ createdAt: -1 });

    const examStatsList = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        const results = await Result.find({
          examId: exam._id,
          status: { $in: ['submitted', 'auto_submitted'] },
        });

        const totalAttempts = results.length;
        const avgScore = totalAttempts > 0
          ? (results.reduce((sum, r) => sum + r.score, 0) / totalAttempts).toFixed(2)
          : 0;

        return {
          ...exam.toObject(),
          questionCount,
          totalAttempts,
          avgScore: Number(avgScore),
        };
      })
    );

    res.json({ success: true, count: examStatsList.length, exams: examStatsList });
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
