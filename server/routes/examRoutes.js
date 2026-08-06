const express = require('express');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to check exam ownership for teachers
const checkExamOwnership = (exam, user) => {
  if (user.role === 'teacher' && exam.createdBy && exam.createdBy.toString() !== user._id.toString()) {
    return false;
  }
  return true;
};

// @route   GET /api/exams
// @desc    Get exams (Filtered for students, created-by for teacher, all for admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    let exams;
    if (req.user.role === 'admin') {
      exams = await Exam.find().sort({ createdAt: -1 });
    } else if (req.user.role === 'teacher') {
      exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    } else {
      exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });
    }

    const examDataList = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        const userAttempt = await Result.findOne({
          examId: exam._id,
          studentId: req.user._id,
        });

        const totalAttemptsCount = await Result.countDocuments({
          examId: exam._id,
          status: { $in: ['submitted', 'auto_submitted'] },
        });

        return {
          ...exam.toObject(),
          questionCount,
          totalAttemptsCount,
          userAttempt: userAttempt
            ? {
                id: userAttempt._id,
                status: userAttempt.status,
                score: userAttempt.score,
                totalMarks: userAttempt.totalMarks,
                submittedAt: userAttempt.submittedAt,
              }
            : null,
        };
      })
    );

    res.json({ success: true, exams: examDataList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/exams/:id
// @desc    Get single exam details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Task 6: Return 404 if unpublished and requested by a student
    if (!exam.isPublished && req.user.role === 'student') {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Teacher ownership check for viewing draft details
    if (req.user.role === 'teacher' && !checkExamOwnership(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view exams created by you.' });
    }

    const questionCount = await Question.countDocuments({ examId: exam._id });
    const userAttempt = await Result.findOne({
      examId: exam._id,
      studentId: req.user._id,
    });

    res.json({
      success: true,
      exam: {
        ...exam.toObject(),
        questionCount,
        userAttempt: userAttempt
          ? {
              id: userAttempt._id,
              status: userAttempt.status,
              score: userAttempt.score,
              totalMarks: userAttempt.totalMarks,
              submittedAt: userAttempt.submittedAt,
            }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/exams
// @desc    Create new exam (Teacher or Admin)
router.post('/', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      bookletCode,
      subject,
      durationMinutes,
      defaultMarksPerQuestion,
      defaultNegativeMarks,
      startTime,
      endTime,
      isPublished,
      instructions,
    } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Exam title and duration are required.' });
    }

    const exam = await Exam.create({
      title,
      description,
      bookletCode: bookletCode || 'NEET-CODE-A',
      subject: subject || 'General',
      durationMinutes: Number(durationMinutes),
      defaultMarksPerQuestion: Number(defaultMarksPerQuestion || 4),
      defaultNegativeMarks: Number(defaultNegativeMarks || 1),
      startTime: startTime || null,
      endTime: endTime || null,
      isPublished: Boolean(isPublished),
      instructions: instructions && instructions.length > 0 ? instructions : undefined,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam details (Teacher or Admin)
router.put('/:id', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (!checkExamOwnership(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only edit exams created by you.' });
    }

    Object.assign(exam, req.body);
    await exam.save();

    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/exams/:id/toggle-publish
// @desc    Toggle exam publish status (Teacher or Admin)
router.patch('/:id/toggle-publish', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (!checkExamOwnership(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only publish/unpublish exams created by you.' });
    }

    exam.isPublished = !exam.isPublished;
    await exam.save();

    res.json({
      success: true,
      message: `Exam ${exam.isPublished ? 'published' : 'unpublished'} successfully.`,
      isPublished: exam.isPublished,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam and associated questions and results (Teacher or Admin)
router.delete('/:id', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (!checkExamOwnership(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete exams created by you.' });
    }

    await Question.deleteMany({ examId: exam._id });
    await Result.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.json({ success: true, message: 'Exam and all associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
