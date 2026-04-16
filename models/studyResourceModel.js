import mongoose from 'mongoose';

const practiceQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [
    {
      text: String,
      isCorrect: Boolean
    }
  ],
  correctAnswer: String,
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

const studyResourceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    subject: {
      type: String,
      required: true
    },

    topic: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ['practice-quiz', 'study-guide', 'video-lesson', 'past-question'],
      required: true
    },

    // AI generated content
    content: {
      // For study guides
      summary: String,
      keyPoints: [String],
      detailedExplanation: String,

      // For practice quizzes and past questions
      questions: [practiceQuestionSchema],

      // For video lessons
      videoTitle: String,
      videoUrl: String,
      videoDuration: String,
      videoDescription: String,
      thumbnailUrl: String
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },

    // AI suggestion metadata
    aiSuggestion: {
      reason: String, // Why AI suggested this
      weakAreaScore: Number, // Student's score in this area
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    },

    // Which exam result triggered this generation
    basedOnExam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },

    basedOnResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result'
    },

    // Cache management
    generatedAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
studyResourceSchema.index({ student: 1, type: 1, subject: 1 });
studyResourceSchema.index({ student: 1, generatedAt: -1 });
studyResourceSchema.index({ expiresAt: 1 }); // For cleanup
studyResourceSchema.index({ student: 1, isActive: 1 });

const StudyResource = mongoose.model('StudyResource', studyResourceSchema);

export default StudyResource;
