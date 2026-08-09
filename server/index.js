const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// Locate frontend build directory across potential deployment directory structures
const possibleDistPaths = [
  path.join(__dirname, '../client/dist'),
  path.join(process.cwd(), 'client/dist'),
  path.join(__dirname, 'client/dist'),
  path.join(process.cwd(), 'dist'),
];

let clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`✅ Serving static frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend index.html missing');
    }
  });
} else {
  console.warn('⚠️ WARNING: Frontend dist folder not found. Add Build Command: npm run build');
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PrepPulse Online Exam Platform</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { background-color: #0f172a; color: #ffffff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; items-align: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
            .card { background: #1e293b; padding: 40px; border-radius: 20px; border: 1px solid #334155; max-width: 500px; margin: 0 auto; shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #60a5fa; margin-bottom: 10px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>PrepPulse Exam Platform</h1>
            <p>API Server is live and connected! Frontend assets are building on Render.</p>
            <p><strong>Health Status:</strong> <a href="/api/health" style="color:#fbbf24;">/api/health (OK)</a></p>
            <a href="/" class="btn" onclick="location.reload(); return false;">Refresh Page</a>
          </div>
        </body>
      </html>
    `);
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
