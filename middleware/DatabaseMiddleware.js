import mongoose from 'mongoose';

export const ensureDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please check your network connection and try again.',
      data: null,
      error: 'DB_UNAVAILABLE'
    });
  }
  next();
};