import mongoose from 'mongoose';

export const ensureDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log('Database not ready, connection state:', mongoose.connection.readyState);
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.',
      data: null,
      error: 'DB_UNAVAILABLE',
      connectionState: mongoose.connection.readyState
    });
  }
  next();
};