import mongoose from 'mongoose';

const resultSchema = mongoose.Schema({
  examSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
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
  score: {
    totalPoints: Number,
    earnedPoints: Number,
    percentage: Number,
    grade: String,
    passed: Boolean
  },
  analytics: {
    timeSpent: Number, // total seconds
    questionsAttempted: Number,
    questionsCorrect: Number,
    averageTimePerQuestion: Number,
    categoryBreakdown: [{
      category: String,
      correct: Number,
      total: Number,
      percentage: Number
    }],
    difficultyBreakdown: [{
      difficulty: String,
      correct: Number,
      total: Number,
      percentage: Number
    }]
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    recommendations: [String]
  },
  classRanking: {
    position: Number,
    totalStudents: Number,
    percentile: Number
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    certificateId: String,
    issuedAt: Date
  }
}, {
  timestamps: true
});

resultSchema.index({ student: 1, exam: 1 }, { unique: true });
resultSchema.index({ exam: 1, 'score.percentage': -1 });

const Result = mongoose.model('Result', resultSchema);
export default Result;