const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const questionRoutes = require('./routes/questionRoutes');
const resultRoutes = require('./routes/resultRoutes');
const bookletRoutes = require('./routes/bookletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedData = require('./utils/seed');
const User = require('./models/User');

dotenv.config();

// Provide fallback JWT_SECRET if missing on deployment platform
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET environment variable is not set. Using secure default key.');
  process.env.JWT_SECRET = 'super_secret_prep_pulse_jwt_key_2026';
}

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString(), app: 'Online Exam Platform API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/booklet', bookletRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend in production / deployment
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  await connectDB();

  // Auto-seed if database has no users
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 No users found in database. Auto-running initial seed script...');
      await seedData();
    }
  } catch (seedErr) {
    console.warn('⚠️ User check / auto-seed skipped:', seedErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Online Exam API Server running on port ${PORT}`);
  });
};

startServer();
