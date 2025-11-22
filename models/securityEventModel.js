import mongoose from 'mongoose';

const securityEventSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession'
  },
  eventType: {
    type: String,
    required: true,
    enum: ['tab_switch', 'window_resize', 'devtools_open', 'internet_disconnect', 'copy_paste', 'right_click', 'fullscreen_exit']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    windowSize: String,
    tabTitle: String,
    duration: Number,
    ipAddress: String,
    userAgent: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

securityEventSchema.index({ sessionId: 1, eventType: 1, timestamp: -1 });

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
export default SecurityEvent;