const mongoose = require('mongoose');

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;

  if (isProduction) {
    if (!mongoUri) {
      console.error('❌ FATAL ERROR: MONGODB_URI environment variable is required in production.');
      process.exit(1);
    }

    try {
      console.log(`Connecting to Production MongoDB database...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Successfully connected to MongoDB production database.');
    } catch (err) {
      console.error('❌ FATAL ERROR: Could not connect to MongoDB database:', err.message);
      process.exit(1);
    }
  } else {
    // Development mode
    if (mongoUri && !mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1')) {
      try {
        console.log(`Connecting to MongoDB URI...`);
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Successfully connected to MongoDB database.');
        return;
      } catch (err) {
        console.warn(`⚠️ Failed to connect to MONGODB_URI: ${err.message}`);
      }
    }

    // Try local mongo or fallback to In-Memory MongoDB Server in development
    try {
      const localUri = mongoUri || 'mongodb://localhost:27017/online_exam_db';
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to local MongoDB database.');
    } catch (err) {
      console.warn('⚠️ Local MongoDB daemon not reachable. Launching In-Memory MongoDB Server for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`✅ Connected to In-Memory MongoDB Server at: ${uri}`);
      } catch (memErr) {
        console.error('❌ FATAL ERROR: Failed to start In-Memory MongoDB:', memErr.message);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
