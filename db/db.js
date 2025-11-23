import mongoose from 'mongoose';

// Disable buffering completely
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const timeouts = {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 3000
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      ...timeouts,
      bufferCommands: false,
      maxPoolSize: 5,
      retryWrites: true,
      w: 'majority',
      dbName: 'cadna-backend-new'
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Production DB connection failed - exiting');
      process.exit(1);
    }
    
    console.log('⚠️  Running without MongoDB - some features disabled');
    return null;
  }
};

export default connectDB;