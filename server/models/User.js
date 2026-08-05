const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows null/empty while ensuring uniqueness if provided
    },
    phone: {
      type: String,
      trim: true,
      sparse: true, // Allows mobile number based login
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
