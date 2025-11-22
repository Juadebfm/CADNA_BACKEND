import mongoose from 'mongoose';

const authLogSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'token_refresh', 'failed_login', '2fa_attempt']
  },
  ipAddress: String,
  userAgent: String,
  sessionDuration: Number, // seconds
  success: {
    type: Boolean,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

authLogSchema.index({ userId: 1, timestamp: -1 });
authLogSchema.index({ action: 1, timestamp: -1 });

const AuthLog = mongoose.model('AuthLog', authLogSchema);
export default AuthLog;