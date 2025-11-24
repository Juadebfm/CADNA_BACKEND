import mongoose from 'mongoose';

// Disable buffering completely
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const timeouts = process.env.NODE_ENV === 'production' ? {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000
    } : {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      ...timeouts,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000
    });
    
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    // Ensure connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Connection not ready');
    }
    
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err; // Re-throw to stop server startup
  }
};

export default connectDB;