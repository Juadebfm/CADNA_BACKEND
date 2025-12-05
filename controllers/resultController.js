import asyncHandler from 'express-async-handler';
import Result from '../models/resultModel.js';
import ExamSession from '../models/examSessionModel.js';
import Exam from '../models/examModel.js';

// @desc    Get exam result by exam ID
// @route   GET /api/results/:examId
// @access  Private (Student - own results only)
export const getExamResult = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  // Find user's result for this exam
  let result = await Result.findOne({ 
    exam: examId, 
    student: req.user._id 
  }).populate('exam', 'title settings').populate('student', 'firstName lastName');
  
  if (!result) {
    // Try to find completed session and create result
    const session = await ExamSession.findOne({
      exam: examId,
      student: req.user._id,
      status: { $in: ['submitted', 'auto-submitted'] }
    }).populate('exam');
    
    if (session && session.isGraded) {
      result = await Result.create({
        examSession: session._id,
        exam: examId,
        student: req.user._id,
        score: session.score,
        analytics: {
          timeSpent: Math.floor((session.endTime - session.startTime) / 1000),
          questionsAttempted: session.answers.length,
          questionsCorrect: session.answers.filter(a => a.isCorrect).length
        }
      });
      
      result = await Result.findById(result._id)
        .populate('exam', 'title settings')
        .populate('student', 'firstName lastName');
    }
  }
  
  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'No result found for this exam'
    });
  }
  
  res.json({
    success: true,
    data: result
  });
});

// @desc    Get detailed result with answers
// @route   GET /api/results/:examId/detailed
// @access  Private (Student - own results only)
export const getDetailedResult = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  const session = await ExamSession.findOne({
    exam: examId,
    student: req.user._id,
    status: { $in: ['submitted', 'auto-submitted'] }
  }).populate('exam');
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'No completed exam session found'
    });
  }
  
  const result = await Result.findOne({
    exam: examId,
    student: req.user._id
  });
  
  res.json({
    success: true,
    data: {
      session,
      result,
      answers: session.answers,
      score: session.score
    }
  });
});