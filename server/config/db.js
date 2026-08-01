const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_exam_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    // Set connection timeout short so fallback triggers quickly if local mongo isn't available
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('⚠️ Local MongoDB connection failed or timed out. Initializing In-Memory MongoDB Server fallback...');
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Connected to In-Memory MongoDB Server at: ${uri}`);
    } catch (memErr) {
      console.error('❌ Failed to connect to In-Memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
