import asyncHandler from 'express-async-handler';
import ExamSession from '../models/examSessionModel.js';
import { signAccessToken } from '../utils/generateToken.js';

// @desc    Extend token during active exam
// @route   POST /api/auth/extend-exam-token
// @access  Private (Student in active exam)
export const extendExamToken = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID required'
    });
  }

  // Verify active exam session
  const session = await ExamSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  if (session.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (session.status !== 'in-progress') {
    return res.status(400).json({
      success: false,
      message: 'Exam session not active'
    });
  }

  // Issue new extended token (6 hours for long exams)
  const extendedToken = signAccessToken(req.user._id.toString(), req.user.role, '6h');
  
  res.json({
    success: true,
    message: 'Token extended for exam session',
    data: { accessToken: extendedToken }
  });
});