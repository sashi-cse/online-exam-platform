const express = require('express');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Synchronous Server-Side Evaluation Engine
const evaluateAttempt = async (result, isAutoSubmit = false) => {
  const questions = await Question.find({ examId: result.examId });

  let totalScore = 0;
  let totalMarksPossible = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const evaluatedAnswers = questions.map((q) => {
    totalMarksPossible += q.marksForCorrect || 4;

    const studentAns = result.answers.find(
      (a) => a.questionId.toString() === q._id.toString()
    );

    const selectedOption = studentAns && studentAns.selectedOption !== undefined ? studentAns.selectedOption : null;
    const isMarkedForReview = studentAns ? Boolean(studentAns.isMarkedForReview) : false;
    const timeSpentSeconds = studentAns ? Number(studentAns.timeSpentSeconds || 0) : 0;

    let isCorrect = false;
    let marksEarned = 0;

    if (selectedOption === null || selectedOption === undefined) {
      unattemptedCount++;
      marksEarned = 0;
    } else if (Number(selectedOption) === Number(q.correctOption)) {
      isCorrect = true;
      correctCount++;
      marksEarned = q.marksForCorrect !== undefined ? q.marksForCorrect : 4;
      totalScore += marksEarned;
    } else {
      isCorrect = false;
      incorrectCount++;
      marksEarned = -(q.negativeMarksForIncorrect !== undefined ? q.negativeMarksForIncorrect : 1);
      totalScore += marksEarned;
    }

    return {
      questionId: q._id,
      selectedOption,
      isCorrect,
      marksEarned,
      isMarkedForReview,
      timeSpentSeconds,
    };
  });

  result.score = totalScore;
  result.totalMarks = totalMarksPossible;
  result.percentage = totalMarksPossible > 0 ? Number(((totalScore / totalMarksPossible) * 100).toFixed(2)) : 0;
  result.counts = {
    correct: correctCount,
    incorrect: incorrectCount,
    unattempted: unattemptedCount,
  };
  result.answers = evaluatedAnswers;
  result.status = isAutoSubmit ? 'auto_submitted' : 'submitted';
  result.submittedAt = new Date();

  await result.save();
  return result;
};

// Helper: Check if exam time limit has expired (with 60-second latency grace period)
const isExamTimeExpired = (result, exam) => {
  const startTimeMs = new Date(result.startTime).getTime();
  const maxAllowedMs = (exam.durationMinutes * 60 + 60) * 1000; // 60s grace period for network delay
  return Date.now() - startTimeMs > maxAllowedMs;
};

// @route   POST /api/results/start/:examId
// @desc    Start or resume an exam attempt
router.post('/start/:examId', verifyToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (!exam.isPublished && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Exam is not currently published.' });
    }

    let existingResult = await Result.findOne({
      examId: exam._id,
      studentId: req.user._id,
    });

    if (existingResult) {
      if (existingResult.status === 'submitted' || existingResult.status === 'auto_submitted') {
        return res.status(400).json({
          success: false,
          alreadySubmitted: true,
          message: 'You have already completed and submitted this exam.',
          resultId: existingResult._id,
        });
      }

      // Time limit check on resume
      if (isExamTimeExpired(existingResult, exam)) {
        const autoSubmittedResult = await evaluateAttempt(existingResult, true);
        return res.status(400).json({
          success: false,
          alreadySubmitted: true,
          message: 'Exam time limit expired. Your attempt has been auto-submitted.',
          resultId: autoSubmittedResult._id,
        });
      }

      return res.json({ success: true, isResume: true, result: existingResult });
    }

    // Initialize new result draft
    const questions = await Question.find({ examId: exam._id });
    const initialAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOption: null,
      isCorrect: false,
      marksEarned: 0,
      isMarkedForReview: false,
      timeSpentSeconds: 0,
    }));

    const newResult = await Result.create({
      studentId: req.user._id,
      examId: exam._id,
      status: 'in_progress',
      answers: initialAnswers,
      startTime: new Date(),
    });

    res.status(201).json({ success: true, isResume: false, result: newResult });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/results/save-progress/:resultId
// @desc    Auto-save current progress and log tab switch violations (Enforces Server-Side Time Limit)
router.post('/save-progress/:resultId', verifyToken, async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Attempt result record not found.' });
    }

    if (result.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized attempt access.' });
    }

    if (result.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Exam has already been submitted.' });
    }

    const exam = await Exam.findById(result.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam record not found.' });
    }

    // Task 4: Server-Side Time-Limit Enforcement
    if (isExamTimeExpired(result, exam)) {
      const { answers } = req.body;
      if (answers && Array.isArray(answers)) {
        result.answers = answers;
      }
      const gradedResult = await evaluateAttempt(result, true);
      return res.status(400).json({
        success: false,
        isTimeExpired: true,
        message: 'Exam duration has expired. Attempt has been auto-submitted.',
        result: gradedResult,
      });
    }

    const { answers, tabSwitchCount, violation } = req.body;

    if (answers && Array.isArray(answers)) {
      result.answers = answers;
    }

    if (tabSwitchCount !== undefined) {
      result.tabSwitchCount = tabSwitchCount;
    }

    if (violation) {
      result.violationLogs.push({
        timestamp: new Date(),
        type: violation.type || 'tab_switch',
        details: violation.details || 'Browser tab switch or window blur detected',
      });
    }

    await result.save();
    res.json({ success: true, message: 'Progress saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/results/submit/:resultId
// @desc    Submit exam and trigger SYNCHRONOUS server-side grading (Enforces Server-Side Time Limit)
router.post('/submit/:resultId', verifyToken, async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Attempt result record not found.' });
    }

    if (result.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized attempt access.' });
    }

    if (result.status !== 'in_progress') {
      return res.json({ success: true, message: 'Exam was already submitted.', result });
    }

    const exam = await Exam.findById(result.examId);
    const { answers, tabSwitchCount, isAutoSubmit } = req.body;

    if (answers && Array.isArray(answers)) {
      result.answers = answers;
    }

    if (tabSwitchCount !== undefined) {
      result.tabSwitchCount = tabSwitchCount;
    }

    // Force auto submit if time limit expired
    const forceAuto = isAutoSubmit || (exam && isExamTimeExpired(result, exam));

    // Evaluate score on server synchronously
    const gradedResult = await evaluateAttempt(result, Boolean(forceAuto));

    res.json({
      success: true,
      message: 'Exam evaluated successfully!',
      result: gradedResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/results/my-results
// @desc    Get all completed exam results for logged in student
router.get('/my-results', verifyToken, async (req, res) => {
  try {
    const results = await Result.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .populate('examId', 'title subject durationMinutes bookletCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/results/exam/:examId/analytics
// @desc    Get aggregated analytics & all student attempts for an exam (Teacher or Admin)
router.get('/exam/:examId/analytics', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    // Task 5: Scoped analytics access for teachers
    if (req.user.role === 'teacher' && exam.createdBy && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view analytics for exams created by you.' });
    }

    const results = await Result.find({
      examId: exam._id,
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .populate('studentId', 'name email phone rollNumber')
      .sort({ score: -1 });

    let highestScore = 0;
    let lowestScore = exam.totalMarks || 0;
    let sumScore = 0;
    let passCount = 0;

    if (results.length > 0) {
      highestScore = Math.max(...results.map((r) => r.score));
      lowestScore = Math.min(...results.map((r) => r.score));
      sumScore = results.reduce((acc, r) => acc + r.score, 0);
      passCount = results.filter((r) => r.percentage >= 40).length;
    } else {
      lowestScore = 0;
    }

    const avgScore = results.length > 0 ? (sumScore / results.length).toFixed(2) : 0;
    const passRate = results.length > 0 ? ((passCount / results.length) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      exam,
      stats: {
        totalSubmissions: results.length,
        avgScore: Number(avgScore),
        highestScore,
        lowestScore,
        passRate: Number(passRate),
      },
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/results/:resultId
// @desc    Get detailed report breakdown for a specific attempt (Task 3: Never leak answers for in_progress attempts)
router.get('/:resultId', verifyToken, async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate('examId', 'title description durationMinutes bookletCode totalMarks instructions createdBy')
      .populate('studentId', 'name email');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const isOwner = result.studentId._id.toString() === req.user._id.toString();
    const isTeacherOwner = req.user.role === 'teacher' && result.examId.createdBy && result.examId.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Access control check
    if (!isAdmin && !isTeacherOwner && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to test result.' });
    }

    const questions = await Question.find({ examId: result.examId._id }).sort({ questionNumber: 1 });

    // Task 3: Only reveal correctOption and solution if attempt is submitted/auto_submitted AND (user is teacher/admin OR is student owner)
    const isSubmitted = result.status === 'submitted' || result.status === 'auto_submitted';
    const canViewAnswers = isSubmitted && (isAdmin || isTeacherOwner || (req.user.role === 'student' && isOwner));

    const breakdown = questions.map((q) => {
      const studentAns = result.answers.find(
        (a) => a.questionId.toString() === q._id.toString()
      );

      const baseObj = {
        questionId: q._id,
        questionNumber: q.questionNumber,
        subject: q.subject,
        questionText: q.questionText,
        options: q.options,
        marksForCorrect: q.marksForCorrect,
        negativeMarksForIncorrect: q.negativeMarksForIncorrect,
        studentSelectedOption: studentAns ? studentAns.selectedOption : null,
        isMarkedForReview: studentAns ? studentAns.isMarkedForReview : false,
        timeSpentSeconds: studentAns ? studentAns.timeSpentSeconds : 0,
      };

      if (canViewAnswers) {
        baseObj.correctOption = q.correctOption;
        baseObj.solution = q.solution;
        baseObj.isCorrect = studentAns ? studentAns.isCorrect : false;
        baseObj.marksEarned = studentAns ? studentAns.marksEarned : 0;
      }

      return baseObj;
    });

    res.json({
      success: true,
      result: {
        ...result.toObject(),
        // Omit total score & breakdown details if still in_progress for a student
        score: canViewAnswers ? result.score : undefined,
        percentage: canViewAnswers ? result.percentage : undefined,
      },
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
