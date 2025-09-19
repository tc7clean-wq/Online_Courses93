const { body, validationResult } = require('express-validator');

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),

  url: body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL'),

  mongoId: (field) => body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`),

  price: body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  rating: body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  courseLevel: body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),

  userRole: body('role')
    .isIn(['student', 'instructor', 'admin'])
    .withMessage('Role must be student, instructor, or admin')
};

// Validation rule sets for different endpoints
const validationRules = {
  // User registration
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    body('role').optional().isIn(['student', 'instructor']).withMessage('Role must be student or instructor')
  ],

  // User login
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Update user profile
  updateProfile: [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    commonValidations.phone,
    commonValidations.url
  ],

  // Change password
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    commonValidations.password.withMessage('New password must be at least 8 characters with uppercase, lowercase, and number')
  ],

  // Course creation
  createCourse: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Course title must be between 5 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 50, max: 2000 })
      .withMessage('Course description must be between 50 and 2000 characters'),
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category is required and must be less than 50 characters'),
    commonValidations.courseLevel,
    commonValidations.price,
    body('duration')
      .optional()
      .isFloat({ min: 0.5 })
      .withMessage('Duration must be at least 0.5 hours'),
    body('prerequisites')
      .optional()
      .isArray()
      .withMessage('Prerequisites must be an array'),
    body('learningObjectives')
      .optional()
      .isArray()
      .withMessage('Learning objectives must be an array'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],

  // Course update
  updateCourse: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Course title must be between 5 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 50, max: 2000 })
      .withMessage('Course description must be between 50 and 2000 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be less than 50 characters'),
    body('level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Level must be beginner, intermediate, or advanced'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('duration')
      .optional()
      .isFloat({ min: 0.5 })
      .withMessage('Duration must be at least 0.5 hours')
  ],

  // Review creation
  createReview: [
    commonValidations.rating,
    body('comment')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Review comment must be between 10 and 1000 characters'),
    commonValidations.mongoId('courseId')
  ],

  // Enrollment
  createEnrollment: [
    commonValidations.mongoId('courseId')
  ],

  // Progress update
  updateProgress: [
    commonValidations.mongoId('courseId'),
    body('lessonId')
      .optional()
      .isMongoId()
      .withMessage('Lesson ID must be valid'),
    body('progressPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Progress percentage must be between 0 and 100'),
    body('timeSpent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Time spent must be a positive number'),
    body('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean value')
  ],

  // Payment processing
  processPayment: [
    commonValidations.mongoId('courseId'),
    body('paymentMethodId')
      .notEmpty()
      .withMessage('Payment method ID is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0')
  ]
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Custom validation functions
const customValidations = {
  // Check if email already exists (for registration)
  isEmailUnique: async (email, { req }) => {
    const User = require('../models/User');
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser._id.toString() !== req.user?.id) {
      throw new Error('Email already in use');
    }

    return true;
  },

  // Check if course title is unique for instructor
  isCourseUnique: async (title, { req }) => {
    const Course = require('../models/Course');
    const existingCourse = await Course.findOne({
      title,
      instructor: req.user.id
    });

    if (existingCourse && existingCourse._id.toString() !== req.params.id) {
      throw new Error('You already have a course with this title');
    }

    return true;
  },

  // Validate course enrollment eligibility
  canEnrollInCourse: async (courseId, { req }) => {
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.isPublished) {
      throw new Error('Course is not available for enrollment');
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }

    return true;
  },

  // Validate review eligibility
  canReviewCourse: async (courseId, { req }) => {
    const Enrollment = require('../models/Enrollment');
    const Review = require('../models/Review');

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (!enrollment) {
      throw new Error('Must be enrolled to review this course');
    }

    const existingReview = await Review.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingReview) {
      throw new Error('Already reviewed this course');
    }

    return true;
  }
};

// File upload validation
const fileValidation = {
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    validate: (file) => {
      if (!fileValidation.image.allowedTypes.includes(file.mimetype)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }

      if (file.size > fileValidation.image.maxSize) {
        throw new Error('Image size cannot exceed 5MB');
      }

      return true;
    }
  },

  video: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    maxSize: 100 * 1024 * 1024, // 100MB
    validate: (file) => {
      if (!fileValidation.video.allowedTypes.includes(file.mimetype)) {
        throw new Error('Only MP4, WebM, and OGG videos are allowed');
      }

      if (file.size > fileValidation.video.maxSize) {
        throw new Error('Video size cannot exceed 100MB');
      }

      return true;
    }
  },

  document: {
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    validate: (file) => {
      if (!fileValidation.document.allowedTypes.includes(file.mimetype)) {
        throw new Error('Only PDF, TXT, DOC, and DOCX files are allowed');
      }

      if (file.size > fileValidation.document.maxSize) {
        throw new Error('Document size cannot exceed 10MB');
      }

      return true;
    }
  }
};

module.exports = {
  validationRules,
  handleValidationErrors,
  customValidations,
  fileValidation,
  commonValidations
};