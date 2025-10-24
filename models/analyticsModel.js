import mongoose from 'mongoose';

const analyticsSchema = mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metrics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    completedAttempts: {
      type: Number,
      default: 0
    },
    averageScore: Number,
    passRate: Number,
    averageTimeSpent: Number, // minutes
    questionAnalysis: [{
      questionId: mongoose.Schema.Types.ObjectId,
      correctAnswers: Number,
      totalAnswers: Number,
      successRate: Number,
      averageTimeSpent: Number,
      difficulty: String
    }],
    performanceDistribution: [{
      range: String, // "0-20", "21-40", etc.
      count: Number,
      percentage: Number
    }],
    timeAnalysis: {
      fastest: Number,
      slowest: Number,
      median: Number
    }
  },
  trends: {
    daily: [{
      date: Date,
      attempts: Number,
      averageScore: Number
    }],
    weekly: [{
      week: String,
      attempts: Number,
      averageScore: Number
    }],
    monthly: [{
      month: String,
      attempts: Number,
      averageScore: Number
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

analyticsSchema.index({ exam: 1, instructor: 1 });
analyticsSchema.index({ lastUpdated: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;