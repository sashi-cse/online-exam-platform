const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (mongoUri) {
    // Production: only try the configured URI
    console.log('Connecting to MongoDB Atlas / Database...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Successfully connected to MongoDB database.');
    return;
  }

  // Development fallback: try local, then in-memory
  try {
    await mongoose.connect('mongodb://localhost:27017/online_exam_db', { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to local MongoDB database.');
  } catch (err) {
    console.warn('⚠️ Local MongoDB not reachable. Launching In-Memory MongoDB Server...');
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

