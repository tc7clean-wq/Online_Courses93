const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions.',
          required: allowedRoles,
          current: req.user.role
        });
      }

      // For instructor role, check if approved
      if (req.user.role === 'instructor' && !req.user.instructor.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Instructor account not yet approved.',
          status: 'pending_approval'
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role verification.'
      });
    }
  };
};

// Specific role checkers
const isAdmin = roleCheck(['admin']);
const isInstructor = roleCheck(['instructor', 'admin']);
const isInstructorOnly = roleCheck(['instructor']);
const isStudent = roleCheck(['student', 'instructor', 'admin']);

// Check if user owns resource or is admin
const ownerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get owner ID using provided function
      const ownerId = await getOwnerId(req);

      if (!ownerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check if user owns the resource
      if (ownerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      console.error('Owner check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in ownership verification.'
      });
    }
  };
};

// Check if user can access course content
const courseAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { id: courseId } = req.params;
    const Enrollment = require('../models/Enrollment');
    const Course = require('../models/Course');

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Course instructor can access their own course
    const course = await Course.findById(courseId);
    if (course && course.instructor.toString() === req.user.id.toString()) {
      return next();
    }

    // Check if user has valid enrollment
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this course.',
        action: 'enroll_required'
      });
    }

    // Add enrollment info to request
    req.enrollment = hasAccess;

    next();
  } catch (error) {
    console.error('Course access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in course access verification.'
    });
  }
};

// Rate limiting for sensitive operations
const rateLimitByUser = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(userId)) {
      const userAttempts = attempts.get(userId).filter(time => time > windowStart);
      attempts.set(userId, userAttempts);
    }

    const currentAttempts = attempts.get(userId) || [];

    if (currentAttempts.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((currentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Record this attempt
    currentAttempts.push(now);
    attempts.set(userId, currentAttempts);

    next();
  };
};

module.exports = roleCheck;
module.exports.isAdmin = isAdmin;
module.exports.isInstructor = isInstructor;
module.exports.isInstructorOnly = isInstructorOnly;
module.exports.isStudent = isStudent;
module.exports.ownerOrAdmin = ownerOrAdmin;
module.exports.courseAccess = courseAccess;
module.exports.rateLimitByUser = rateLimitByUser;