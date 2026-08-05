const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true, // Email address or Mobile phone number
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true, // Bcrypt hashed 6-digit OTP string
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-delete expired OTP records using MongoDB TTL index
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
