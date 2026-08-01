const mongoose = require('mongoose');

const ResultAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: {
    type: Number,
    default: null, // null means unattempted
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksEarned: {
    type: Number,
    default: 0,
  },
  isMarkedForReview: {
    type: Boolean,
    default: false,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
});

const ResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted'],
      default: 'in_progress',
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    counts: {
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
      unattempted: { type: Number, default: 0 },
    },
    answers: [ResultAnswerSchema],
    startTime: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    violationLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        type: { type: String, default: 'tab_switch' },
        details: { type: String, default: 'User switched browser tab or window' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', ResultSchema);
