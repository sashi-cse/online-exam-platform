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

    console.log('👤 Seeding Admin & Student accounts...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);

    const admin = await User.create({
      name: 'Dr. Sharma (Physics & Chemistry Teacher)',
      email: 'admin@exam.com',
      password: adminPassword,
      role: 'admin',
    });

    const student = await User.create({
      name: 'Rahul Verma',
      email: 'student@exam.com',
      password: studentPassword,
      role: 'student',
    });

    console.log(`✅ Accounts Created:\n   Admin: admin@exam.com / admin123\n   Student: student@exam.com / student123`);

    console.log('📝 Seeding NEET Entrance Exam & Questions with LaTeX math...');

    const neetExam = await Exam.create({
      title: 'NEET & JEE Physics, Chemistry & Biology Mock Test 2026',
      description: 'Comprehensive entrance practice exam with full continuous question paper, auto-grading, tab-monitoring, and KaTeX math equations.',
      bookletCode: 'NEET-2026-SET-A',
      subject: 'Physics, Chemistry & Biology',
      durationMinutes: 30,
      defaultMarksPerQuestion: 4,
      defaultNegativeMarks: 1,
      isPublished: true,
      instructions: [
        'Total Duration is 30 minutes.',
        'Each correct answer carries +4 marks. Each incorrect response incurs -1 mark.',
        'Questions contain continuous numbering from Question 1 to Question 6.',
        'Equations use standard LaTeX formatting. Check step-by-step solutions after submission.',
        'Do not switch browser tabs or exit fullscreen mode during the test.'
      ],
      createdBy: admin._id,
    });

    const sampleQuestions = [
      {
        examId: neetExam._id,
        questionNumber: 1,
        subject: 'Physics',
        questionText: 'A particle moves along a straight line such that its velocity varies with displacement $x$ as $v = 3\\sqrt{x}$ m/s. What is the acceleration of the particle?',
        options: ['1.5 m/s²', '4.5 m/s²', '9.0 m/s²', '3.0 m/s²'],
        correctOption: 1, // 4.5 m/s²
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: 'Acceleration $a = v \\frac{dv}{dx}$. Given $v = 3x^{1/2}$, we have $\\frac{dv}{dx} = 3 \\cdot \\frac{1}{2} x^{-1/2}$. Therefore, $a = (3\\sqrt{x}) \\left(\\frac{3}{2\\sqrt{x}}\\right) = \\frac{9}{2} = 4.5 \\text{ m/s}^2$.',
      },
      {
        examId: neetExam._id,
        questionNumber: 2,
        subject: 'Physics',
        questionText: 'What is the equivalent resistance between points A and B in a infinite ladder network where each resistor has resistance $R = 6 \\,\\Omega$?',
        options: ['3 Ω', '6 Ω', '9 Ω', '12 Ω'],
        correctOption: 1, // 6 Ω
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: 'For an infinite ladder of equal resistors $R$, the equivalent resistance $R_{eq}$ satisfies $R_{eq} = R + \\frac{R \\cdot R_{eq}}{R + R_{eq}}$. Solving the quadratic equation yields $R_{eq} = R = 6 \\,\\Omega$.',
      },
      {
        examId: neetExam._id,
        questionNumber: 3,
        subject: 'Chemistry',
        questionText: 'Which of the following compounds has the highest bond angle around the central atom according to VSEPR theory?',
        options: ['$\\text{NH}_3$', '$\\text{H}_2\\text{O}$', '$\\text{CH}_4$', '$\\text{CO}_2$'],
        correctOption: 3, // CO2 (180 deg)
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: '$\\text{CO}_2$ has $sp$ hybridization with linear geometry and a bond angle of $180^\\circ$. $\\text{CH}_4$ is $109.5^\\circ$, $\\text{NH}_3$ is $107^\\circ$, and $\\text{H}_2\\text{O}$ is $104.5^\\circ$.',
      },
      {
        examId: neetExam._id,
        questionNumber: 4,
        subject: 'Chemistry',
        questionText: 'The pH of a $10^{-8} \\text{ M}$ solution of $\\text{HCl}$ in water at $25^\\circ\\text{C}$ is approximately:',
        options: ['8.00', '6.98', '7.00', '6.00'],
        correctOption: 1, // 6.98
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: 'Water auto-ionization must be considered because $[\\text{H}^+]_{\\text{water}} = 10^{-7} \\text{ M}$. Total $[\\text{H}^+] = 10^{-8} + 10^{-7} = 1.1 \\times 10^{-7} \\text{ M}$. Taking $\\text{pH} = -\\log_{10}(1.1 \\times 10^{-7}) \\approx 6.98$.',
      },
      {
        examId: neetExam._id,
        questionNumber: 5,
        subject: 'Botany',
        questionText: 'During oxygenic photosynthesis, the primary electron donor for Photosystem II (PS II) is:',
        options: ['$\\text{CO}_2$', '$\\text{H}_2\\text{O}$', 'NADPH', 'ATP'],
        correctOption: 1, // H2O
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: 'Water photolysis in the oxygen-evolving complex of PS II splits $2\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\text{H}^+ + 4e^-$, supplying electrons to replace those excited from $P680$.',
      },
      {
        examId: neetExam._id,
        questionNumber: 6,
        subject: 'Zoology',
        questionText: 'Which hormone triggers ovulation and the formation of the corpus luteum in human females?',
        options: ['FSH (Follicle Stimulating Hormone)', 'LH (Luteinizing Hormone)', 'Estrogen', 'Progesterone'],
        correctOption: 1, // LH
        marksForCorrect: 4,
        negativeMarksForIncorrect: 1,
        solution: 'A rapid surge in Luteinizing Hormone (LH surge) around mid-cycle (day 14) induces rupture of the Graafian follicle, ovulation, and transformation into the corpus luteum.',
      },
    ];

    await Question.insertMany(sampleQuestions);

    // Calculate and save total marks for the exam
    const totalMarks = sampleQuestions.reduce((sum, q) => sum + q.marksForCorrect, 0);
    neetExam.totalMarks = totalMarks;
    await neetExam.save();

    console.log(`✅ Seeded Exam "${neetExam.title}" with ${sampleQuestions.length} questions (Total Marks: ${totalMarks}).`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
};

// Execute if run directly
if (require.main === module) {
  seedData().then(() => {
    console.log('🌱 Seeding process complete!');
    process.exit(0);
  });
}

module.exports = seedData;
