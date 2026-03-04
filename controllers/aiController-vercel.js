import asyncHandler from 'express-async-handler';
import aiOperations from '../services/ai/AIoperations-vercel.js';
import aiService from '../services/ai/AIService-vercel.js';
import ExamSession from '../models/examSessionModel.js';

// @desc    Grade an essay answer
// @route   POST /api/ai/grade-essay
// @access  Private (Instructor/Admin)
export const gradeEssay = asyncHandler(async (req, res) => {
  const { question, answer, rubric, maxScore, provider } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Question and answer are required'
    });
  }

  const result = await aiOperations.gradeEssay({
    question,
    answer,
    rubric,
    maxScore: maxScore || 100,
    provider,
    user: req.user,
    context: {
      examId: req.body.examId,
      sessionId: req.body.sessionId
    }
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Grade multiple essays in batch
// @route   POST /api/ai/grade-essays-batch
// @access  Private (Instructor/Admin)
export const gradeEssaysBatch = asyncHandler(async (req, res) => {
  const { essays, provider } = req.body;

  if (!essays || !Array.isArray(essays)) {
    return res.status(400).json({
      success: false,
      message: 'Essays array is required'
    });
  }

  const results = [];
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const essay of essays) {
    const result = await aiOperations.gradeEssay({
      ...essay,
      provider,
      user: req.user,
      context: {
        examId: essay.examId,
        sessionId: essay.sessionId
      }
    });
    
    if (result.success) {
      successCount++;
      totalCost += result.cost || 0;
    } else {
      failureCount++;
    }

    results.push({
      success: result.success,
      questionId: essay.questionId,
      grading: result.result,
      error: result.error,
      cost: result.cost
    });
  }

  res.json({
    success: true,
    results,
    summary: {
      total: essays.length,
      successful: successCount,
      failed: failureCount,
      totalCost: totalCost.toFixed(4)
    }
  });
});

// @desc    Detect AI-generated content
// @route   POST /api/ai/detect-ai
// @access  Private (Instructor/Admin)
export const detectAI = asyncHandler(async (req, res) => {
  const { answer, provider } = req.body;

  if (!answer) {
    return res.status(400).json({
      success: false,
      message: 'Answer text is required'
    });
  }

  const result = await aiOperations.detectAI({ 
    answer, 
    provider,
    user: req.user,
    context: {
      sessionId: req.body.sessionId,
      questionId: req.body.questionId
    }
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Detect plagiarism between two answers
// @route   POST /api/ai/detect-plagiarism
// @access  Private (Instructor/Admin)
export const detectPlagiarism = asyncHandler(async (req, res) => {
  const { answer1, answer2, provider } = req.body;

  if (!answer1 || !answer2) {
    return res.status(400).json({
      success: false,
      message: 'Both answers are required'
    });
  }

  const result = await aiOperations.detectPlagiarism({
    answer1,
    answer2,
    provider,
    user: req.user,
    context: {
      examId: req.body.examId
    }
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Analyze exam session for suspicious behavior
// @route   POST /api/ai/analyze-behavior/:sessionId
// @access  Private (Instructor/Admin)
export const analyzeExamBehavior = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { provider } = req.body;

  const session = await ExamSession.findById(sessionId)
    .populate('exam')
    .populate('student', 'firstName lastName email');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Exam session not found'
    });
  }

  // Compile behavior data
  const behaviors = {
    violations: session.violations,
    totalViolations: session.totalViolations,
    integrityEvents: session.integrityEvents?.slice(0, 10),
    answeredQuestions: session.answers.length,
    totalQuestions: session.exam?.questions?.length || 0,
    timeSpent: session.endTime ? 
      Math.floor((session.endTime - session.startTime) / 1000) : null,
    flagged: session.flagged,
    aiAnalysis: session.aiAnalysis
  };

  const result = await aiOperations.analyzeBehavior({
    behaviors,
    provider,
    user: req.user,
    context: {
      sessionId: session._id,
      examId: session.exam._id
    }
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  // Update session with AI analysis
  if (!session.aiAnalysis) {
    session.aiAnalysis = {
      suspiciousActivity: [],
      riskScore: 0
    };
  }

  session.aiAnalysis.suspiciousActivity.push({
    type: 'ai_behavior_analysis',
    timestamp: new Date(),
    severity: result.result.riskScore > 70 ? 'high' : 
              result.result.riskScore > 40 ? 'medium' : 'low',
    data: result.result
  });
  
  session.aiAnalysis.riskScore = Math.max(
    session.aiAnalysis.riskScore || 0,
    result.result.riskScore
  );

  await session.save();

  res.json({
    ...result,
    sessionId: session._id,
    student: {
      id: session.student._id,
      name: `${session.student.firstName} ${session.student.lastName}`,
      email: session.student.email
    }
  });
});

// @desc    Generate exam questions
// @route   POST /api/ai/generate-questions
// @access  Private (Instructor/Admin)
export const generateQuestions = asyncHandler(async (req, res) => {
  const {
    topic,
    difficulty = 'medium',
    count = 5,
    questionTypes = ['multiple-choice'],
    provider
  } = req.body;

  if (!topic) {
    return res.status(400).json({
      success: false,
      message: 'Topic is required'
    });
  }

  const result = await aiOperations.generateQuestions({
    topic,
    difficulty,
    count,
    questionTypes,
    provider,
    user: req.user,
    context: {
      examId: req.body.examId
    }
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Generate similar questions (variations)
// @route   POST /api/ai/generate-similar
// @access  Private (Instructor/Admin)
export const generateSimilar = asyncHandler(async (req, res) => {
  const { existingQuestion, count = 3, provider } = req.body;

  if (!existingQuestion) {
    return res.status(400).json({
      success: false,
      message: 'Existing question is required'
    });
  }

  const result = await aiOperations.generateSimilar({
    existingQuestion,
    count,
    provider,
    user: req.user,
    context: {}
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Improve a question based on feedback
// @route   POST /api/ai/improve-question
// @access  Private (Instructor/Admin)
export const improveQuestion = asyncHandler(async (req, res) => {
  const { question, feedback, provider } = req.body;

  if (!question || !feedback) {
    return res.status(400).json({
      success: false,
      message: 'Question and feedback are required'
    });
  }

  const result = await aiOperations.improveQuestion({
    question,
    feedback,
    provider,
    user: req.user,
    context: {}
  });

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

// @desc    Get AI service status
// @route   GET /api/ai/status
// @access  Private (Admin)
export const getAIStatus = asyncHandler(async (req, res) => {
  const status = aiOperations.getStatus();

  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString()
  });
});

// @desc    Get usage statistics
// @route   GET /api/ai/usage-stats
// @access  Private (Admin)
export const getUsageStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const stats = await aiOperations.getUsageStats(days);

  res.json({
    success: true,
    ...stats,
    timestamp: new Date().toISOString()
  });
});

// @desc    Get daily costs
// @route   GET /api/ai/daily-costs
// @access  Private (Admin)
export const getDailyCosts = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const costs = await aiOperations.getDailyCosts(days);

  res.json({
    success: true,
    ...costs,
    timestamp: new Date().toISOString()
  });
});

// @desc    Check cost limit
// @route   GET /api/ai/cost-limit
// @access  Private (Admin)
export const checkCostLimit = asyncHandler(async (req, res) => {
  const limit = await aiOperations.checkCostLimit();

  res.json({
    success: true,
    ...limit,
    timestamp: new Date().toISOString()
  });
});

// @desc    Test AI service
// @route   POST /api/ai/test
// @access  Private (Admin)
export const testAIService = asyncHandler(async (req, res) => {
  const { provider } = req.body;

  const testResult = await aiOperations.gradeEssay({
    question: 'What is photosynthesis?',
    answer: 'Photosynthesis is the process by which plants convert sunlight into energy.',
    rubric: 'Basic understanding',
    maxScore: 10,
    provider,
    user: req.user,
    context: { test: true }
  });

  res.json({
    success: true,
    test: 'basic_grading',
    result: testResult,
    status: aiOperations.getStatus()
  });
});

// @desc    Switch AI provider
// @route   POST /api/ai/switch-provider
// @access  Private (Admin)
export const switchProvider = asyncHandler(async (req, res) => {
  const { provider } = req.body;

  if (!provider) {
    return res.status(400).json({
      success: false,
      message: 'Provider is required'
    });
  }

  const validProviders = ['groq', 'openai', 'anthropic', 'google', 'mock'];
  if (!validProviders.includes(provider)) {
    return res.status(400).json({
      success: false,
      message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
    });
  }

  aiService.primaryProvider = provider;

  res.json({
    success: true,
    message: `Switched to ${provider}`,
    status: aiOperations.getStatus()
  });
});
