const express = require('express');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to recalculate total exam marks
const updateExamTotalMarks = async (examId) => {
  const questions = await Question.find({ examId });
  const total = questions.reduce((sum, q) => sum + (q.marksForCorrect || 4), 0);
  await Exam.findByIdAndUpdate(examId, { totalMarks: total });
};

// Helper to check exam ownership for questions
const checkExamOwnership = async (examId, user) => {
  if (user.role === 'teacher') {
    const exam = await Exam.findById(examId);
    if (!exam || (exam.createdBy && exam.createdBy.toString() !== user._id.toString())) {
      return false;
    }
  }
  return true;
};

// @route   GET /api/questions/exam/:examId
// @desc    Get all questions for an exam
// SECURITY FIX: ALWAYS strip `correctOption` and `solution` for student role, regardless of mode!
router.get('/exam/:examId', verifyToken, async (req, res) => {
  try {
    const questions = await Question.find({ examId: req.params.examId }).sort({ questionNumber: 1 });

    let sanitizedQuestions = questions;
    if (req.user.role === 'student') {
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
// @desc    Create a question for an exam (Teacher or Admin)
router.post('/exam/:examId', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (req.user.role === 'teacher' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only add questions to exams created by you.' });
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
// @desc    Update a question (Teacher or Admin)
router.put('/:id', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isOwner = await checkExamOwnership(question.examId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only edit questions for exams created by you.' });
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
// @desc    Delete a question (Teacher or Admin)
router.delete('/:id', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isOwner = await checkExamOwnership(question.examId, req.user);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only delete questions for exams created by you.' });
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
