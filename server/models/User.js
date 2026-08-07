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
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for passwordHash compatibility
UserSchema.virtual('passwordHash').get(function () {
  return this.password;
});

module.exports = mongoose.model('User', UserSchema);
