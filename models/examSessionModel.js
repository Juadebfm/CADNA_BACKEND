import mongoose from 'mongoose';

const answerSchema = mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: mongoose.Schema.Types.Mixed, // String, Array, or Object
  timeSpent: Number, // seconds
  flagged: {
    type: Boolean,
    default: false
  },
  isCorrect: Boolean,
  points: Number
});

const examSessionSchema = mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted', 'cancelled'],
    default: 'in-progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  timeRemaining: Number, // seconds
  score: {
    total: Number,
    percentage: Number,
    passed: Boolean
  },
  aiAnalysis: {
    suspiciousActivity: [{
      type: String,
      timestamp: Date,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  browserInfo: {
    userAgent: String,
    screenResolution: String,
    timezone: String
  },
  ipAddress: String,
  isGraded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

examSessionSchema.index({ exam: 1, student: 1 });
examSessionSchema.index({ status: 1, createdAt: -1 });

const ExamSession = mongoose.model('ExamSession', examSessionSchema);
export default ExamSession;