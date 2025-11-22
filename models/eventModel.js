import mongoose from 'mongoose';

const eventSchema = mongoose.Schema({
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
  questionId: {
    type: mongoose.Schema.Types.ObjectId
  },
  eventType: {
    type: String,
    required: true,
    enum: ['view_question', 'answer_question', 'flag_question', 'anti_cheating_flag', 'submit_exam', 'session_timeout', 'session_start', 'session_end']
  },
  data: {
    answer: String,
    timeTakenSeconds: Number,
    flagType: String,
    deviceInfo: String,
    ipAddress: String,
    userAgent: String,
    severity: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, eventType: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;