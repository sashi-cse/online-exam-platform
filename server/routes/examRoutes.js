const express = require('express');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/exams
// @desc    Get exams (Filtered for students, all for admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    let exams;
    if (req.user.role === 'admin') {
      exams = await Exam.find().sort({ createdAt: -1 });
    } else {
      exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });
    }

    // Attach total question count & student attempt status
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
// @desc    Create new exam (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
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
// @desc    Update exam details (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    Object.assign(exam, req.body);
    await exam.save();

    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/exams/:id/toggle-publish
// @desc    Toggle exam publish status (Admin only)
router.patch('/:id/toggle-publish', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
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
// @desc    Delete exam and associated questions and results (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
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
