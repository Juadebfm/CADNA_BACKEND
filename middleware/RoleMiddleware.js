import asyncHandler from 'express-async-handler';

// Middleware to check if user has required role
export const requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  });
};

// Specific role middlewares
export const requireAdmin = requireRole('admin');
export const requireInstructor = requireRole('instructor', 'admin');
export const requireStudent = requireRole('student', 'instructor', 'admin');