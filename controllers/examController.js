import asyncHandler from 'express-async-handler';
import Exam from '../models/examModel.js';
import ExamSession from '../models/examSessionModel.js';
import redis from '../db/redis.js';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Public
export const getExams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  
  const query = { isActive: true };
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const exams = await Exam.find(query)
    .populate('instructor', 'name email')
    .select('-questions.correctAnswer')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Exam.countDocuments(query);

  res.json({
    success: true,
    data: {
      exams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Public
export const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('instructor', 'name email')
    .select('-questions.correctAnswer');

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  res.json({
    success: true,
    data: exam
  });
});

// @desc    Create exam
// @route   POST /api/exams
// @access  Private (Instructor/Admin)
export const createExam = asyncHandler(async (req, res) => {
  const examData = {
    ...req.body,
    instructor: req.user._id
  };

  const exam = await Exam.create(examData);
  
  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: exam
  });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Instructor/Admin)
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check ownership
  if (exam.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this exam'
    });
  }

  const updatedExam = await Exam.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Exam updated successfully',
    data: updatedExam
  });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Instructor/Admin)
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check ownership
  if (exam.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this exam'
    });
  }

  await Exam.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

// @desc    Enroll in exam
// @route   POST /api/exams/:id/enroll
// @access  Private (Student)
export const enrollInExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  if (exam.enrolledStudents.includes(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this exam'
    });
  }

  exam.enrolledStudents.push(req.user._id);
  await exam.save();

  res.json({
    success: true,
    message: 'Successfully enrolled in exam'
  });
});

// @desc    Start exam session
// @route   POST /api/exams/:id/start
// @access  Private (Student)
export const startExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check if student is enrolled
  if (!exam.enrolledStudents.includes(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not enrolled in this exam'
    });
  }

  // Check if exam is within schedule
  const now = new Date();
  if (exam.schedule.startDate && now < exam.schedule.startDate) {
    return res.status(400).json({
      success: false,
      message: 'Exam has not started yet'
    });
  }

  if (exam.schedule.endDate && now > exam.schedule.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Exam has ended'
    });
  }

  // Check for existing active session
  const existingSession = await ExamSession.findOne({
    exam: req.params.id,
    student: req.user._id,
    status: 'in-progress'
  });

  if (existingSession) {
    return res.json({
      success: true,
      message: 'Resuming existing session',
      data: existingSession
    });
  }

  // Create new session
  const session = await ExamSession.create({
    exam: req.params.id,
    student: req.user._id,
    timeRemaining: exam.settings.timeLimit * 60, // convert to seconds
    browserInfo: {
      userAgent: req.headers['user-agent'],
      timezone: req.body.timezone
    },
    ipAddress: req.ip
  });

  // Cache session in Redis for quick access (if available)
  await redis.setEx(`exam_session:${session._id}`, 3600, JSON.stringify(session));

  res.json({
    success: true,
    message: 'Exam session started',
    data: session
  });
});