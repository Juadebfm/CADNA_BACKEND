import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Result from "../models/resultModel.js";
import ExamSession from "../models/examSessionModel.js";

const userSelect = "-password -refreshToken -twoFASecret -twoFATempSecret";
const checkAccess = (reqUser, targetId) =>
  reqUser._id.toString() === targetId || reqUser.role === "admin";

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(userSelect);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (!checkAccess(req.user, req.params.id))
    return res.status(403).json({ success: false, message: "Not authorized" });

  res.json({ success: true, data: user });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (!checkAccess(req.user, req.params.id))
    return res.status(403).json({ success: false, message: "Not authorized" });

  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "university",
    "studentId",
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  });

  if (req.user.role === "admin" && req.body.role)
    updateData.role = req.body.role;

  const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select(userSelect);
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const getUserResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  if (!checkAccess(req.user, req.params.id))
    return res.status(403).json({ success: false, message: "Not authorized" });

  const [results, total, stats] = await Promise.all([
    Result.find({ student: req.params.id })
      .populate("exam", "title description category")
      .populate("examSession", "startTime endTime status")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }),
    Result.countDocuments({ student: req.params.id }),
    Result.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: "$score.percentage" },
          passedExams: { $sum: { $cond: ["$score.passed", 1, 0] } },
          totalTimeSpent: { $sum: "$analytics.timeSpent" },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      results,
      statistics: stats[0] || {
        totalExams: 0,
        averageScore: 0,
        passedExams: 0,
        totalTimeSpent: 0,
      },
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getUserSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  if (!checkAccess(req.user, req.params.id))
    return res.status(403).json({ success: false, message: "Not authorized" });

  const query = { student: req.params.id };
  if (status) query.status = status;

  const [sessions, total] = await Promise.all([
    ExamSession.find(query)
      .populate("exam", "title description settings")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }),
    ExamSession.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });

  const { page = 1, limit = 10, role, search } = req.query;
  const query = {};

  if (role) query.role = role;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { university: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(userSelect)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: +page,
        limit: +limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });

  const user = await User.findById(req.params.id);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });
  if (user.role === "admin" && req.user._id.toString() !== req.params.id) {
    return res
      .status(403)
      .json({ success: false, message: "Cannot delete other admin users" });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});
