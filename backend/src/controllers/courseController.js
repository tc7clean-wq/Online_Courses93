const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Review = require('../models/Review');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Public routes
exports.getAllCourses = async (req, res) => {
  try {
    const {
      category,
      level,
      sortBy = 'popular',
      page = 1,
      limit = 12,
      minPrice,
      maxPrice
    } = req.query;

    const query = { status: 'published', isPublic: true };

    // Apply filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (minPrice || maxPrice) {
      query['pricing.basic.price'] = {};
      if (minPrice) query['pricing.basic.price'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basic.price'].$lte = parseFloat(maxPrice);
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { enrollmentCount: -1, averageRating: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1, reviewCount: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'price-low':
        sort = { 'pricing.basic.price': 1 };
        break;
      case 'price-high':
        sort = { 'pricing.basic.price': -1 };
        break;
      default:
        sort = { enrollmentCount: -1 };
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar profile.title')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-modules'); // Exclude modules for performance

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: skip + courses.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

exports.getFeaturedCourses = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await Course.findFeatured()
      .limit(parseInt(limit))
      .select('-modules');

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured courses',
      error: error.message
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Course.aggregate([
      { $match: { status: 'published', isPublic: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(cat => ({
        name: cat._id,
        count: cat.count,
        averageRating: Math.round(cat.avgRating * 10) / 10
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

exports.searchCourses = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (page - 1) * limit;

    const courses = await Course.search(q)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-modules');

    const totalResults = await Course.search(q).countDocuments();

    res.json({
      success: true,
      data: {
        courses,
        query: q,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalResults / limit),
          total: totalResults
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching courses',
      error: error.message
    });
  }
};

exports.getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { includeModules = 'false' } = req.query;

    let selectFields = '';
    if (includeModules === 'false') {
      selectFields = '-modules';
    }

    const course = await Course.findOne({ slug, status: 'published', isPublic: true })
      .populate('instructor', 'name avatar profile instructor.averageRating instructor.totalStudents')
      .select(selectFields);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // If user is authenticated, check enrollment status
    let enrollmentStatus = null;
    let progress = null;

    if (req.user) {
      const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: course._id
      });

      if (enrollment) {
        enrollmentStatus = {
          isEnrolled: true,
          packageType: enrollment.packageType,
          enrollmentStatus: enrollment.enrollmentStatus,
          enrolledAt: enrollment.accessDetails.grantedAt
        };

        // Get progress
        progress = await course.getProgressForUser(req.user.id);
      }
    }

    res.json({
      success: true,
      data: {
        course,
        enrollmentStatus,
        progress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

exports.getCourseReviews = async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating, sortBy = 'helpful', page = 1, limit = 10 } = req.query;

    const course = await Course.findOne({ slug });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.findByCourse(course._id, {
      rating: rating ? parseInt(rating) : null,
      sortBy,
      skip,
      limit: parseInt(limit)
    });

    const reviewStats = await Review.getAverageRating(course._id);

    res.json({
      success: true,
      data: {
        reviews,
        stats: reviewStats,
        pagination: {
          current: parseInt(page),
          hasNext: reviews.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Protected routes
exports.enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageType = 'basic', paymentIntentId } = req.body;

    // Check if course exists
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Validate package type
    if (!course.pricing[packageType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package type'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user.id,
      course: id,
      packageType,
      paymentDetails: {
        stripePaymentIntentId: paymentIntentId,
        amount: course.pricing[packageType].price,
        paymentStatus: paymentIntentId ? 'completed' : 'pending',
        paidAt: paymentIntentId ? new Date() : null
      }
    });

    await enrollment.save();

    // Create initial progress record
    const progress = new Progress({
      user: req.user.id,
      course: id,
      enrollment: enrollment._id
    });

    await progress.save();

    // Update course enrollment count
    await course.updateStats();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        enrollment,
        progress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

exports.checkCourseAccess = async (req, res) => {
  try {
    const { id } = req.params;

    const hasAccess = await Enrollment.hasAccess(req.user.id, id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const course = await Course.findById(id)
      .populate('instructor', 'name avatar');

    res.json({
      success: true,
      data: {
        hasAccess: true,
        course,
        enrollment: hasAccess
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking course access',
      error: error.message
    });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const progress = await Progress.findOne({
      user: req.user.id,
      course: id
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const course = await Course.findById(id);
    const completionPercentage = await progress.getCompletionPercentage();

    res.json({
      success: true,
      data: {
        progress,
        completionPercentage,
        totalLessons: course.totalLessons,
        completedLessons: progress.completedLessons.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
};

exports.updateLessonProgress = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { watchTime = 0, watchPercentage = 100, currentTime = 0 } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: id
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Mark lesson as complete if watch percentage >= 80%
    if (watchPercentage >= 80) {
      await progress.markLessonComplete(lessonId, watchTime, watchPercentage);
    }

    // Update current lesson position
    const course = await Course.findById(id);
    let moduleIndex = 0;
    let lessonIndex = 0;

    // Find lesson position
    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      for (let lIdx = 0; lIdx < course.modules[mIdx].lessons.length; lIdx++) {
        if (course.modules[mIdx].lessons[lIdx]._id.toString() === lessonId) {
          moduleIndex = mIdx;
          lessonIndex = lIdx;
          break;
        }
      }
    }

    await progress.updateCurrentLesson(moduleIndex, lessonIndex, lessonId, currentTime);

    // Add study time
    if (watchTime > 0) {
      await progress.addStudyTime(watchTime);
    }

    const completionPercentage = await progress.getCompletionPercentage();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        completionPercentage,
        isLessonCompleted: progress.isLessonCompleted(lessonId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { rating, title, content, pros, cons, wouldRecommend = true } = req.body;

    // Check if user has access to the course
    const enrollment = await Enrollment.findOne({
      user: req.user.id,
      course: id,
      'paymentDetails.paymentStatus': 'completed'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to leave a review'
      });
    }

    // Check if user already reviewed this course
    const existingReview = await Review.findOne({
      user: req.user.id,
      course: id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    const review = new Review({
      user: req.user.id,
      course: id,
      enrollment: enrollment._id,
      rating,
      title,
      content,
      pros: pros || [],
      cons: cons || [],
      wouldRecommend
    });

    await review.save();

    // Update course stats
    const course = await Course.findById(id);
    await course.updateStats();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Instructor routes
exports.createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const courseData = {
      ...req.body,
      instructor: req.user.id,
      slug: generateSlug(req.body.title)
    };

    // Ensure slug is unique
    let counter = 1;
    let originalSlug = courseData.slug;
    while (await Course.findOne({ slug: courseData.slug })) {
      courseData.slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Update slug if title changed
    if (req.body.title && req.body.title !== course.title) {
      let newSlug = generateSlug(req.body.title);
      let counter = 1;
      let originalSlug = newSlug;

      while (await Course.findOne({ slug: newSlug, _id: { $ne: id } })) {
        newSlug = `${originalSlug}-${counter}`;
        counter++;
      }

      req.body.slug = newSlug;
    }

    Object.assign(course, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ course: id });
    if (enrollmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with active enrollments'
      });
    }

    await Course.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Validate course is ready for publishing
    if (!course.modules || course.modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course must have at least one module to publish'
      });
    }

    let hasLessons = false;
    for (const module of course.modules) {
      if (module.lessons && module.lessons.length > 0) {
        hasLessons = true;
        break;
      }
    }

    if (!hasLessons) {
      return res.status(400).json({
        success: false,
        message: 'Course must have at least one lesson to publish'
      });
    }

    course.status = 'published';
    course.launchDate = new Date();
    await course.save();

    res.json({
      success: true,
      message: 'Course published successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing course',
      error: error.message
    });
  }
};

exports.unpublishCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    course.status = 'draft';
    await course.save();

    res.json({
      success: true,
      message: 'Course unpublished successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unpublishing course',
      error: error.message
    });
  }
};

// Module management
exports.addModule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const moduleData = {
      ...req.body,
      lessons: []
    };

    course.modules.push(moduleData);
    await course.save();

    const newModule = course.modules[course.modules.length - 1];

    res.status(201).json({
      success: true,
      message: 'Module added successfully',
      data: newModule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding module',
      error: error.message
    });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id, moduleId } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    Object.assign(module, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating module',
      error: error.message
    });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const { id, moduleId } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    course.modules.id(moduleId).remove();
    await course.save();

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting module',
      error: error.message
    });
  }
};

// Lesson management
exports.addLesson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id, moduleId } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    module.lessons.push(req.body);
    await course.save();

    const newLesson = module.lessons[module.lessons.length - 1];

    res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      data: newLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding lesson',
      error: error.message
    });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id, moduleId, lessonId } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    Object.assign(lesson, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating lesson',
      error: error.message
    });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { id, moduleId, lessonId } = req.params;
    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    module.lessons.id(lessonId).remove();
    await course.save();

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message
    });
  }
};

// Analytics
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Get revenue stats
    const revenueStats = await Enrollment.getRevenueStats(id);

    // Get enrollment trends
    const enrollmentTrends = await Enrollment.getEnrollmentTrends(id, period);

    // Get review stats
    const reviewStats = await Review.getAverageRating(id);

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          title: course.title,
          enrollmentCount: course.enrollmentCount,
          averageRating: course.averageRating,
          reviewCount: course.reviewCount
        },
        revenue: revenueStats,
        enrollmentTrends,
        reviews: reviewStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const course = await Course.findOne({
      _id: id,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({ course: id })
      .populate('user', 'name email avatar stats')
      .sort({ 'accessDetails.grantedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get progress for each enrollment
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await Progress.findOne({
          user: enrollment.user._id,
          course: id
        });

        const completionPercentage = progress
          ? await progress.getCompletionPercentage()
          : 0;

        return {
          enrollment,
          progress: {
            completionPercentage,
            lastAccessed: progress?.lastAccessedLesson?.accessedAt,
            studyTime: progress?.formattedStudyTime || '0m'
          }
        };
      })
    );

    const totalStudents = await Enrollment.countDocuments({ course: id });

    res.json({
      success: true,
      data: {
        students: studentsWithProgress,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalStudents / limit),
          total: totalStudents
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Admin routes
exports.getAllCoursesAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-modules');

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

exports.toggleFeatureCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isFeatured = !course.isFeatured;
    await course.save();

    res.json({
      success: true,
      message: `Course ${course.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { isFeatured: course.isFeatured }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course feature status',
      error: error.message
    });
  }
};

exports.approveCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.status = 'published';
    await course.save();

    res.json({
      success: true,
      message: 'Course approved and published successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving course',
      error: error.message
    });
  }
};