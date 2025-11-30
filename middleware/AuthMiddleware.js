import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import NodeCache from 'node-cache';

export const tokenBlacklist = new NodeCache({ stdTTL: 600 }); // 10 min by default

export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      status: false,
      message: 'Not authorized, no token provided',
      data: null
    });
  }

  // Blacklist check
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      status: false,
      message: 'Token is invalidated. Please log in again.',
      data: null
    });
  }

  try {
    // Verify token (will throw if invalid/expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both { sub } and { id } JWT shapes
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: 'Token payload missing user id',
        data: null
      });
    }

    // Find user and attach to req
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'User not found',
        data: null
      });
    }

    req.user = user;
    return next(); // IMPORTANT: return so the function stops here
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({
      status: false,
      message: 'Not authorized, token failed',
      data: null
    });
  }
});

// Optional auth - doesn't fail if no token, just sets req.user if valid token exists
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = null;

  // Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // If no token, continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  // Blacklist check
  if (tokenBlacklist.has(token)) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;
    
    if (userId) {
      const user = await User.findById(userId).select('-password');
      req.user = user;
    }
  } catch (err) {
    // Token invalid, continue without user
    req.user = null;
  }
  
  return next();
});
