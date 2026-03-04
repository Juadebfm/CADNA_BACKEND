import mongoose from 'mongoose';

/**
 * AI Log Model - Tracks all AI operations safely
 * PRIVACY: No PII stored, only anonymized references
 */
const aiLogSchema = new mongoose.Schema({
  // Unique log ID (for tracking, not linked to student)
  logId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Operation details
  operation: {
    type: String,
    required: true,
    enum: [
      'grade_essay',
      'grade_short_answer',
      'grade_exam',          
      'detect_ai',
      'detect_plagiarism',
      'analyze_behavior',
      'generate_questions',
      'generate_similar',
      'improve_question'
    ],
    index: true
  },

  // AI Provider info
  provider: {
    type: String,
    required: true,
    enum: ['groq', 'openai', 'anthropic', 'google', 'mock', 'system']  // ✅ ADDED 'system' - For non-AI grading
  },

  model: {
    type: String,
    required: true
  },

  // Request metadata (NO actual content)
  request: {
    inputLength: Number,        // Length of input text
    inputWordCount: Number,     // Word count
    inputType: String,          // essay, short-answer, etc.
    questionType: String,       // multiple-choice, essay, etc.
    hasRubric: Boolean,         // Whether rubric was provided
    maxScore: Number            // Maximum possible score
  },

  // Response metadata (NO actual content)
  response: {
    outputLength: Number,       // Length of output
    outputWordCount: Number,    // Word count
    hasScore: Boolean,          // Whether score was returned
    hasFeedback: Boolean,       // Whether feedback was returned
    hasAnalysis: Boolean        // Whether analysis was returned
  },

  // Performance metrics
  performance: {
    startTime: Date,
    endTime: Date,
    duration: Number,           // Milliseconds
    success: Boolean,
    errorCode: String,
    errorMessage: String
  },

  // Cost tracking
  cost: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    costUSD: Number,            // Cost in USD
    isFree: Boolean             // Whether it was free tier
  },

  // Context (anonymized references)
  context: {
    sessionRef: String,         // Hashed session ID (SHA-256)
    examRef: String,            // Hashed exam ID (SHA-256)
    questionRef: String,        // Hashed question ID (SHA-256)
    userRole: String            // instructor, admin, student (never actual ID)
  },

  // Compliance & Audit
  audit: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ipAddress: String,          // Hashed or anonymized
    userAgent: String,
    purpose: String             // grading, cheating_detection, etc.
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for performance
aiLogSchema.index({ createdAt: -1 });
aiLogSchema.index({ operation: 1, createdAt: -1 });
aiLogSchema.index({ provider: 1, createdAt: -1 });
aiLogSchema.index({ 'audit.requestedBy': 1 });
aiLogSchema.index({ 'performance.success': 1 });

// Static method: Get cost summary
aiLogSchema.statics.getCostSummary = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          $lte: endDate || new Date()
        }
      }
    },
    {
      $group: {
        _id: '$provider',
        totalCost: { $sum: '$cost.costUSD' },
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$cost.totalTokens' },
        avgDuration: { $avg: '$performance.duration' },
        successRate: {
          $avg: { $cond: ['$performance.success', 1, 0] }
        }
      }
    }
  ]);
};

// Static method: Get usage by operation
aiLogSchema.statics.getUsageByOperation = async function(days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$operation',
        count: { $sum: 1 },
        totalCost: { $sum: '$cost.costUSD' },
        avgDuration: { $avg: '$performance.duration' },
        successRate: {
          $avg: { $cond: ['$performance.success', 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method: Get error summary
aiLogSchema.statics.getErrorSummary = async function(days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        'performance.success': false
      }
    },
    {
      $group: {
        _id: {
          operation: '$operation',
          errorCode: '$performance.errorCode'
        },
        count: { $sum: 1 },
        lastOccurred: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const AILog = mongoose.model('AILog', aiLogSchema);

export default AILog;
