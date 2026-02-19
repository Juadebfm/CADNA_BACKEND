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
  
  // Anti-cheating / Integrity tracking (NEW)
  integrityEvents: [{
    eventType: {
      type: String,
      enum: [
        'tab_switch',
        'window_blur',
        'fullscreen_exit',
        'fullscreen_denied',
        'copy_attempt',
        'paste_attempt',
        'print_attempt',
        'print_screen_attempt',
        'devtools_attempt',
        'context_menu_attempt',
        'other'
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeFromStart: {
      type: Number, // Seconds from exam start
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    ipAddress: String,
    userAgent: String
  }],

  violations: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    windowBlurs: {
      type: Number,
      default: 0
    },
    fullscreenExits: {
      type: Number,
      default: 0
    },
    copyAttempts: {
      type: Number,
      default: 0
    },
    otherViolations: {
      type: Number,
      default: 0
    }
  },

  totalViolations: {
    type: Number,
    default: 0
  },

  flagged: {
    type: Boolean,
    default: false
  },

  flagReason: {
    type: String
  },
  
  // Existing AI Analysis
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

// Indexes
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });
examSessionSchema.index({ student: 1, status: 1 });
examSessionSchema.index({ flagged: 1 }); // NEW: Index for flagged sessions

const ExamSession = mongoose.model('ExamSession', examSessionSchema);
export default ExamSession;
