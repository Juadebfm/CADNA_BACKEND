import mongoose from 'mongoose';

const questionTrackingSchema = mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterTime: {
    type: Date,
    required: true
  },
  exitTime: Date,
  timeSpent: Number, // seconds
  flaggedAt: Date,
  unflaggedAt: Date,
  revisitCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

questionTrackingSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

const QuestionTracking = mongoose.model('QuestionTracking', questionTrackingSchema);
export default QuestionTracking;