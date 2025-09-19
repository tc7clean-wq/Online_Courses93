const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateCourse = [
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('shortDescription').notEmpty().trim().isLength({ min: 10, max: 300 }),
  body('longDescription').notEmpty().trim(),
  body('category').isIn(['business', 'finance', 'technology', 'marketing', 'personal-development', 'other']),
  body('level').isIn(['beginner', 'intermediate', 'advanced']),
  body('pricing.basic.price').isNumeric().custom(value => value >= 0)
];

const validateLesson = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 200 }),
  body('description').notEmpty().trim(),
  body('videoUrl').notEmpty().isURL(),
  body('videoDuration').isNumeric().custom(value => value > 0),
  body('order').isNumeric()
];

const validateModule = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 200 }),
  body('description').notEmpty().trim(),
  body('order').isNumeric()
];

// Public routes - no authentication required
router.get('/', courseController.getAllCourses);
router.get('/featured', courseController.getFeaturedCourses);
router.get('/categories', courseController.getCategories);
router.get('/search', courseController.searchCourses);
router.get('/:slug', courseController.getCourseBySlug);
router.get('/:slug/reviews', courseController.getCourseReviews);

// Protected routes - authentication required
router.use(authMiddleware);

// Student routes
router.post('/:id/enroll', courseController.enrollInCourse);
router.get('/:id/access', courseController.checkCourseAccess);
router.get('/:id/progress', courseController.getCourseProgress);
router.post('/:id/progress/lesson/:lessonId', courseController.updateLessonProgress);
router.post('/:id/reviews', [
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('content').notEmpty().trim().isLength({ min: 10, max: 2000 })
], courseController.createReview);

// Instructor routes
router.use(roleMiddleware(['instructor', 'admin']));

router.post('/', validateCourse, courseController.createCourse);
router.put('/:id', validateCourse, courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.post('/:id/publish', courseController.publishCourse);
router.post('/:id/unpublish', courseController.unpublishCourse);

// Module management
router.post('/:id/modules', validateModule, courseController.addModule);
router.put('/:id/modules/:moduleId', validateModule, courseController.updateModule);
router.delete('/:id/modules/:moduleId', courseController.deleteModule);

// Lesson management
router.post('/:id/modules/:moduleId/lessons', validateLesson, courseController.addLesson);
router.put('/:id/modules/:moduleId/lessons/:lessonId', validateLesson, courseController.updateLesson);
router.delete('/:id/modules/:moduleId/lessons/:lessonId', courseController.deleteLesson);

// Course analytics for instructors
router.get('/:id/analytics', courseController.getCourseAnalytics);
router.get('/:id/students', courseController.getCourseStudents);

// Admin only routes
router.use(roleMiddleware(['admin']));
router.get('/admin/all', courseController.getAllCoursesAdmin);
router.post('/:id/feature', courseController.toggleFeatureCourse);
router.post('/:id/approve', courseController.approveCourse);

module.exports = router;