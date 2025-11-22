import mongoose from 'mongoose';

const userEngagementSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession'
  },
  engagementType: {
    type: String,
    required: true,
    enum: ['hint_used', 'analytics_viewed', 'practice_question', 'panic_button', 'resource_access', 'exam_started', 'exam_abandoned']
  },
  resourceId: String,
  metadata: {
    hintContent: String,
    practiceScore: Number,
    panicReason: String,
    resourceType: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userEngagementSchema.index({ userId: 1, timestamp: -1 });
userEngagementSchema.index({ examId: 1, engagementType: 1 });

const UserEngagement = mongoose.model('UserEngagement', userEngagementSchema);
export default UserEngagement;