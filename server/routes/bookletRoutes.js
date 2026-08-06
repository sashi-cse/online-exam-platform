const express = require('express');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/booklet/exam/:examId
// @desc    Get complete data package for Test Booklet printing & export (Teacher / Admin ONLY)
router.get('/exam/:examId', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Teacher ownership check
    if (req.user.role === 'teacher' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view booklets for exams you created.' });
    }

    const questions = await Question.find({ examId: exam._id }).sort({ questionNumber: 1 });

    // Group questions by subject for structured booklet sections
    const subjectsMap = {};
    questions.forEach((q) => {
      const subj = q.subject || 'General';
      if (!subjectsMap[subj]) {
        subjectsMap[subj] = [];
      }
      subjectsMap[subj].push(q);
    });

    const answerKey = questions.map((q) => ({
      questionNumber: q.questionNumber,
      correctOption: q.correctOption,
      subject: q.subject,
    }));

    res.json({
      success: true,
      booklet: {
        exam,
        totalQuestions: questions.length,
        subjects: Object.keys(subjectsMap).map((subj) => ({
          name: subj,
          questions: subjectsMap[subj],
        })),
        allQuestions: questions,
        answerKey,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
