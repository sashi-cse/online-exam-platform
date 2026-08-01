const express = require('express');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to recalculate total exam marks
const updateExamTotalMarks = async (examId) => {
  const questions = await Question.find({ examId });
  const total = questions.reduce((sum, q) => sum + (q.marksForCorrect || 4), 0);
  await Exam.findByIdAndUpdate(examId, { totalMarks: total });
};

// @route   GET /api/questions/exam/:examId
// @desc    Get all questions for an exam
// SECURITY: Omit `correctOption` and `solution` if requested by student during an exam taking process!
router.get('/exam/:examId', verifyToken, async (req, res) => {
  try {
    const { mode } = req.query; // mode=take for exam taking mode
    const questions = await Question.find({ examId: req.params.examId }).sort({ questionNumber: 1 });

    let sanitizedQuestions = questions;
    if (req.user.role === 'student' && mode === 'take') {
      sanitizedQuestions = questions.map((q) => {
        const obj = q.toObject();
        delete obj.correctOption;
        delete obj.solution;
        return obj;
      });
    }

    res.json({ success: true, count: sanitizedQuestions.length, questions: sanitizedQuestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/questions/exam/:examId
// @desc    Create a question for an exam (Admin only)
router.post('/exam/:examId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const {
      questionText,
      options,
      correctOption,
      marksForCorrect,
      negativeMarksForIncorrect,
      subject,
      solution,
      questionNumber,
    } = req.body;

    if (!questionText || !options || options.length < 2 || correctOption === undefined) {
      return res.status(400).json({ success: false, message: 'Question text, at least 2 options, and correct option are required.' });
    }

    // Determine continuous question number if not passed
    let qNum = questionNumber;
    if (!qNum) {
      const count = await Question.countDocuments({ examId: exam._id });
      qNum = count + 1;
    }

    const question = await Question.create({
      examId: exam._id,
      questionNumber: Number(qNum),
      subject: subject || exam.subject || 'General',
      questionText,
      options,
      correctOption: Number(correctOption),
      marksForCorrect: marksForCorrect !== undefined ? Number(marksForCorrect) : exam.defaultMarksPerQuestion,
      negativeMarksForIncorrect: negativeMarksForIncorrect !== undefined ? Number(negativeMarksForIncorrect) : exam.defaultNegativeMarks,
      solution: solution || '',
    });

    await updateExamTotalMarks(exam._id);

    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    Object.assign(question, req.body);
    await question.save();

    await updateExamTotalMarks(question.examId);

    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const examId = question.examId;
    await question.deleteOne();

    // Re-index question numbers continuously
    const remaining = await Question.find({ examId }).sort({ questionNumber: 1 });
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].questionNumber = i + 1;
      await remaining[i].save();
    }

    await updateExamTotalMarks(examId);

    res.json({ success: true, message: 'Question deleted and numbering re-indexed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
