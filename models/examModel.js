import mongoose from 'mongoose';

const questionSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'code'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  points: {
    type: Number,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: String,
  media: {
    type: String, // URL to image/video
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio']
    }
  }
});

const examSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  settings: {
    timeLimit: {
      type: Number, // minutes
      required: true
    },
    passingScore: {
      type: Number,
      default: 60
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    antiCheating: {
      type: Boolean,
      default: true
    },
    autoGrading: {
      type: Boolean,
      default: true
    }
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: String,
  tags: [String]
}, {
  timestamps: true
});

examSchema.index({ instructor: 1, isActive: 1 });
examSchema.index({ isActive: 1, createdAt: -1 });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;