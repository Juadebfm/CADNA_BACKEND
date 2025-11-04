import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Result from '../models/resultModel.js';
import ExamSession from '../models/examSessionModel.js';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken -twoFASecret -twoFATempSecret');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user can access this profile
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this profile'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user can update this profile
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this profile'
    });
  }

  // Fields that can be updated
  const allowedFields = ['firstName', 'lastName', 'phone', 'university', 'studentId'];
  const updateData = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Admin can update role
  if (req.user.role === 'admin' && req.body.role) {
    updateData.role = req.body.role;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshToken -twoFASecret -twoFATempSecret');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// @desc    Get user results
// @route   GET /api/users/:id/results
// @access  Private
export const getUserResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Check if user can access these results
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these results'
    });
  }

  const results = await Result.find({ student: req.params.id })
    .populate('exam', 'title description category')
    .populate('examSession', 'startTime endTime status')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Result.countDocuments({ student: req.params.id });

  // Calculate overall statistics
  const stats = await Result.aggregate([
    { $match: { student: req.params.id } },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        passedExams: {
          $sum: { $cond: ['$score.passed', 1, 0] }
        },
        totalTimeSpent: { $sum: '$analytics.timeSpent' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      results,
      statistics: stats[0] || {
        totalExams: 0,
        averageScore: 0,
        passedExams: 0,
        totalTimeSpent: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user exam sessions
// @route   GET /api/users/:id/sessions
// @access  Private
export const getUserSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  // Check if user can access these sessions
  if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these sessions'
    });
  }

  const query = { student: req.params.id };
  if (status) query.status = status;

  const sessions = await ExamSession.find(query)
    .populate('exam', 'title description settings')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await ExamSession.countDocuments(query);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized - Admin access required'
    });
  }

  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { university: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password -refreshToken -twoFASecret -twoFATempSecret')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized - Admin access required'
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Don't allow deleting other admins
  if (user.role === 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete other admin users'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});