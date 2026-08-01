const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      validate: [val => val.length >= 2, 'At least 2 options are required'],
      required: true,
    },
    correctOption: {
      type: Number,
      required: true, // 0-indexed index of options array
    },
    marksForCorrect: {
      type: Number,
      default: 4,
    },
    negativeMarksForIncorrect: {
      type: Number,
      default: 1,
    },
    solution: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', QuestionSchema);
