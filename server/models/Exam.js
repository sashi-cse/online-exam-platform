const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    bookletCode: {
      type: String,
      default: 'NEET-CODE-A',
      trim: true,
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      default: 60,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    defaultMarksPerQuestion: {
      type: Number,
      default: 4,
    },
    defaultNegativeMarks: {
      type: Number,
      default: 1,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    instructions: {
      type: [String],
      default: [
        'Each question carries specified positive marks for correct response and negative marks for wrong response.',
        'Unattempted questions receive 0 marks.',
        'Switching browser tabs or exiting full screen is strictly monitored and logged.',
        'The timer starts as soon as you enter the exam interface and automatically submits upon completion.'
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', ExamSchema);
