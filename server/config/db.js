const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (mongoUri) {
    try {
      console.log(`Connecting to MongoDB Atlas / Database...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      console.log('✅ Successfully connected to MongoDB database.');
      return;
    } catch (err) {
      console.error('⚠️ Could not connect to primary MONGODB_URI:', err.message);
    }
  }

  // Fallback to local daemon or In-Memory MongoDB Server
  try {
    const localUri = mongoUri || 'mongodb://localhost:27017/online_exam_db';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to local MongoDB database.');
  } catch (err) {
    console.warn('⚠️ Primary MongoDB not reachable. Launching In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Connected to In-Memory MongoDB Server at: ${uri}`);
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr.message);
    }
  }
};

module.exports = connectDB;
