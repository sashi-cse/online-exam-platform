const mongoose = require('mongoose');
const User = require('../models/User');
const Result = require('../models/Result');
const connectDB = require('../config/db');
require('dotenv').config();

const resetAkanshaResults = async () => {
  try {
    await connectDB();

    // Find student Akansha
    const student = await User.findOne({
      $or: [
        { email: 'student@school.com' },
        { phone: '9123456789' },
        { name: /Akansha/i },
        { name: /Rahul/i }
      ]
    });

    if (!student) {
      console.log('⚠️ Student Akansha not found in database.');
      process.exit(0);
    }

    const deleted = await Result.deleteMany({ studentId: student._id });
    console.log(`✅ SUCCESS! Cleared ${deleted.deletedCount} exam result attempt(s) for student "${student.name}" (${student.email}).`);
    console.log('🎓 Akansha can now retake any exam from fresh on the portal!');
  } catch (err) {
    console.error('❌ Error resetting Akansha results:', err);
  }
};

if (require.main === module) {
  resetAkanshaResults().then(() => process.exit(0));
}

module.exports = resetAkanshaResults;
