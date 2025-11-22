import mongoose from 'mongoose';

// Disable buffering globally
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    const timeouts = isProduction ? {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000
    } : {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      ...timeouts,
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
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