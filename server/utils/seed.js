const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const connectDB = require('../config/db');
require('dotenv').config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing seed data...');
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Question.deleteMany({});

    console.log('👤 Seeding Super Admin, Teacher & Student accounts...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const teacherPassword = await bcrypt.hash('teacher123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);

    // 1. Super Admin Account (Role: 'admin')
    const superAdmin = await User.create({
      name: 'System Super Administrator',
      email: 'admin@school.com',
      phone: '9000000000',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    // 2. Teacher Account (Role: 'teacher')
    const teacher = await User.create({
      name: 'Dr. Sharma (Physics & Chemistry Teacher)',
      email: 'teacher@school.com',
      phone: '9876543210',
      password: teacherPassword,
      role: 'teacher',
      department: 'Physics & Chemistry',
      isVerified: true,
      isActive: true,
    });

    // 3. Student Account (Role: 'student', Default Name: 'Akansha')
    const student = await User.create({
      name: 'Akansha',
      email: 'student@school.com',
      phone: '9123456789',
      password: studentPassword,
      role: 'student',
      rollNumber: 'NEET-2026-001',
      isVerified: true,
      isActive: true,
    });

    console.log(`✅ Seed Accounts Created:`);
    console.log(`   👑 Super Admin : admin@school.com (Pass: admin123)`);
    console.log(`   👨‍🏫 Teacher     : teacher@school.com / 9876543210 (Pass: teacher123)`);
    console.log(`   🎓 Student     : Akansha (student@school.com / 9123456789) (Pass: student123)`);

    // Import and seed Set 1 and Set 2 NEET Practice Tests
    const seedNeetExam = require('./seedNeetPracticeTest');
    const seedNeetSet2Exam = require('./seedNeetSet2');
    await seedNeetExam();
    await seedNeetSet2Exam();

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

if (require.main === module) {
  seedData().then(() => {
    console.log('🌱 Seeding process complete!');
    process.exit(0);
  });
}

module.exports = seedData;
