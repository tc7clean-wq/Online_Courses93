const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get user's enrollments
router.get('/my-courses', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 12 } = req.query;

    const query = { user: req.user.id };
    if (status) {
      query.enrollmentStatus = status;
    }

    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title slug thumbnail shortDescription totalDuration totalLessons category level averageRating')
      .sort({ 'accessDetails.grantedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await Progress.findOne({
          user: req.user.id,
          course: enrollment.course._id
        });

        const completionPercentage = progress
          ? await progress.getCompletionPercentage()
          : 0;

        return {
          ...enrollment.toObject(),
          progress: {
            completionPercentage,
            lastAccessedLesson: progress?.lastAccessedLesson,
            studyTime: progress?.formattedStudyTime || '0m',
            completedLessons: progress?.completedLessons?.length || 0
          }
        };
      })
    );

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: {
        enrollments: enrollmentsWithProgress,
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
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
});

// Get specific enrollment details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
      _id: id,
      user: req.user.id
    }).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get progress
    const progress = await Progress.findOne({
      user: req.user.id,
      course: enrollment.course._id
    });

    const completionPercentage = progress
      ? await progress.getCompletionPercentage()
      : 0;

    res.json({
      success: true,
      data: {
        enrollment,
        progress: {
          completionPercentage,
          lastAccessedLesson: progress?.lastAccessedLesson,
          studyTime: progress?.formattedStudyTime || '0m',
          completedLessons: progress?.completedLessons?.length || 0,
          totalLessons: enrollment.course.totalLessons
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
      error: error.message
    });
  }
});

// Record course access
router.post('/:id/access', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
      _id: id,
      user: req.user.id
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    await enrollment.recordAccess();

    res.json({
      success: true,
      message: 'Access recorded',
      data: {
        accessCount: enrollment.accessDetails.accessCount,
        lastAccessed: enrollment.accessDetails.lastAccessedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording access',
      error: error.message
    });
  }
});

// Request certificate
router.post('/:id/certificate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findOne({
      _id: id,
      user: req.user.id
    }).populate('course', 'title hasCertificate');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (!enrollment.course.hasCertificate) {
      return res.status(400).json({
        success: false,
        message: 'This course does not offer certificates'
      });
    }

    if (enrollment.completionDetails.certificateIssued) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already issued',
        data: {
          certificateId: enrollment.completionDetails.certificateId,
          issuedAt: enrollment.completionDetails.certificateIssuedAt
        }
      });
    }

    const certificateId = await enrollment.issueCertificate();

    res.json({
      success: true,
      message: 'Certificate issued successfully',
      data: {
        certificateId,
        issuedAt: enrollment.completionDetails.certificateIssuedAt
      }
    });
  } catch (error) {
    if (error.message === 'Course must be completed before issuing certificate') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error issuing certificate',
      error: error.message
    });
  }
});

// Get enrollment statistics for student
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Enrollment.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedCourses: {
            $sum: {
              $cond: [{ $eq: ['$enrollmentStatus', 'completed'] }, 1, 0]
            }
          },
          activeCourses: {
            $sum: {
              $cond: [{ $eq: ['$enrollmentStatus', 'active'] }, 1, 0]
            }
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $eq: ['$paymentDetails.paymentStatus', 'completed'] },
                '$paymentDetails.amount',
                0
              ]
            }
          },
          certificatesEarned: {
            $sum: {
              $cond: ['$completionDetails.certificateIssued', 1, 0]
            }
          }
        }
      }
    ]);

    const progressStats = await Progress.getStudyStats(userId);

    res.json({
      success: true,
      data: {
        enrollments: stats[0] || {
          totalEnrollments: 0,
          completedCourses: 0,
          activeCourses: 0,
          totalSpent: 0,
          certificatesEarned: 0
        },
        progress: progressStats[0] || {
          totalStudyTime: 0,
          totalCompletedLessons: 0,
          activeCourses: 0,
          totalNotes: 0,
          totalBookmarks: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment statistics',
      error: error.message
    });
  }
});

// Instructor routes - get enrollments for instructor's courses
router.get('/instructor/students', authMiddleware, roleCheck(['instructor', 'admin']), async (req, res) => {
  try {
    const { courseId, status, page = 1, limit = 20 } = req.query;

    // Build query to find courses by instructor
    const courseQuery = { instructor: req.user.id };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery).select('_id');
    const courseIds = courses.map(course => course._id);

    // Build enrollment query
    const enrollmentQuery = {
      course: { $in: courseIds }
    };

    if (status) {
      enrollmentQuery.enrollmentStatus = status;
    }

    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate('user', 'name email avatar')
      .populate('course', 'title slug')
      .sort({ 'accessDetails.grantedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await Progress.findOne({
          user: enrollment.user._id,
          course: enrollment.course._id
        });

        const completionPercentage = progress
          ? await progress.getCompletionPercentage()
          : 0;

        return {
          ...enrollment.toObject(),
          progress: {
            completionPercentage,
            lastAccessed: progress?.lastAccessedLesson?.accessedAt,
            studyTime: progress?.formattedStudyTime || '0m'
          }
        };
      })
    );

    const total = await Enrollment.countDocuments(enrollmentQuery);

    res.json({
      success: true,
      data: {
        enrollments: enrollmentsWithProgress,
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
      message: 'Error fetching student enrollments',
      error: error.message
    });
  }
});

// Get enrollment revenue statistics for instructor
router.get('/instructor/revenue', authMiddleware, roleCheck(['instructor', 'admin']), async (req, res) => {
  try {
    const { courseId, period = '30d' } = req.query;

    // Build query for instructor's courses
    const courseQuery = { instructor: req.user.id };
    if (courseId) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery).select('_id title');
    const courseIds = courses.map(course => course._id);

    // Get revenue stats
    const revenueStats = await Enrollment.getRevenueStats(null, null, null);

    // Filter by instructor's courses
    const instructorRevenue = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          'paymentDetails.paymentStatus': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paymentDetails.amount' },
          totalEnrollments: { $sum: 1 },
          averageOrderValue: { $avg: '$paymentDetails.amount' }
        }
      }
    ]);

    // Get enrollment trends
    const enrollmentTrends = await Enrollment.getEnrollmentTrends(null, period);

    // Filter trends by instructor's courses
    const instructorTrends = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          'accessDetails.grantedAt': {
            $gte: new Date(Date.now() - (period === '7d' ? 7 : period === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$accessDetails.grantedAt'
            }
          },
          enrollments: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$paymentDetails.paymentStatus', 'completed'] },
                '$paymentDetails.amount',
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenue: instructorRevenue[0] || {
          totalRevenue: 0,
          totalEnrollments: 0,
          averageOrderValue: 0
        },
        trends: instructorTrends,
        courses: courses.map(course => ({
          id: course._id,
          title: course.title
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue statistics',
      error: error.message
    });
  }
});

// Admin routes
router.get('/admin/all', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { status, courseId, userId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.enrollmentStatus = status;
    if (courseId) query.course = courseId;
    if (userId) query.user = userId;

    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find(query)
      .populate('user', 'name email')
      .populate('course', 'title instructor')
      .populate('course.instructor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: {
        enrollments,
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
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
});

module.exports = router;