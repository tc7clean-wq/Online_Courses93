const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get progress for a specific course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user has access to the course
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const completionPercentage = await progress.getCompletionPercentage();
    const nextLesson = await progress.getNextLesson();

    res.json({
      success: true,
      data: {
        progress,
        completionPercentage,
        nextLesson,
        stats: {
          totalStudyTime: progress.formattedStudyTime,
          completedLessons: progress.completedLessons.length,
          totalNotes: progress.notes.length,
          totalBookmarks: progress.bookmarks.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
});

// Update lesson progress
router.post('/lesson/:lessonId', authMiddleware, [
  body('courseId').isMongoId(),
  body('watchTime').optional().isNumeric(),
  body('watchPercentage').optional().isNumeric().custom(value => value >= 0 && value <= 100),
  body('currentTime').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { lessonId } = req.params;
    const { courseId, watchTime = 0, watchPercentage = 0, currentTime = 0 } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    let progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    // Update lesson progress
    if (watchPercentage >= 80) {
      await progress.markLessonComplete(lessonId, watchTime, watchPercentage);
    }

    // Find lesson position in course
    const course = await Course.findById(courseId);
    let moduleIndex = 0;
    let lessonIndex = 0;

    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const lessonIdx = course.modules[mIdx].lessons.findIndex(
        lesson => lesson._id.toString() === lessonId
      );
      if (lessonIdx !== -1) {
        moduleIndex = mIdx;
        lessonIndex = lessonIdx;
        break;
      }
    }

    // Update current lesson
    await progress.updateCurrentLesson(moduleIndex, lessonIndex, lessonId, currentTime);

    // Add study time
    if (watchTime > 0) {
      await progress.addStudyTime(watchTime);
    }

    const completionPercentage = await progress.getCompletionPercentage();
    const nextLesson = await progress.getNextLesson();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        completionPercentage,
        isLessonCompleted: progress.isLessonCompleted(lessonId),
        nextLesson,
        currentLesson: progress.currentLesson
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// Add note to lesson
router.post('/notes', authMiddleware, [
  body('courseId').isMongoId(),
  body('lessonId').isMongoId(),
  body('content').notEmpty().trim().isLength({ max: 1000 }),
  body('timestamp').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { courseId, lessonId, content, timestamp = 0 } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const note = await progress.addNote(lessonId, content, timestamp);

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// Get notes for a lesson
router.get('/notes/:courseId/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const notes = progress.getNotesForLesson(lessonId);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error.message
    });
  }
});

// Add bookmark
router.post('/bookmarks', authMiddleware, [
  body('courseId').isMongoId(),
  body('lessonId').isMongoId(),
  body('title').notEmpty().trim().isLength({ max: 200 }),
  body('timestamp').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { courseId, lessonId, title, timestamp } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const bookmark = await progress.addBookmark(lessonId, title, timestamp);

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      data: bookmark
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding bookmark',
      error: error.message
    });
  }
});

// Get bookmarks for a lesson
router.get('/bookmarks/:courseId/:lessonId', authMiddleware, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const bookmarks = progress.getBookmarksForLesson(lessonId);

    res.json({
      success: true,
      data: bookmarks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookmarks',
      error: error.message
    });
  }
});

// Delete bookmark
router.delete('/bookmarks/:bookmarkId', authMiddleware, async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    await progress.removeBookmark(bookmarkId);

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing bookmark',
      error: error.message
    });
  }
});

// Update video preferences
router.put('/preferences', authMiddleware, [
  body('courseId').isMongoId(),
  body('playbackSpeed').optional().isFloat({ min: 0.25, max: 3.0 }),
  body('autoplay').optional().isBoolean(),
  body('quality').optional().isIn(['auto', '480p', '720p', '1080p']),
  body('subtitles').optional().isBoolean(),
  body('language').optional().isLength({ min: 2, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { courseId, ...preferences } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    await progress.updatePreferences(preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: progress.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

// Get all progress for user (dashboard overview)
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const progresses = await Progress.findByUser(req.user.id);

    const progressWithStats = await Promise.all(
      progresses.map(async (progress) => {
        const completionPercentage = await progress.getCompletionPercentage();
        const nextLesson = await progress.getNextLesson();

        return {
          courseId: progress.course._id,
          courseTitle: progress.course.title,
          courseSlug: progress.course.slug,
          courseThumbnail: progress.course.thumbnail,
          completionPercentage,
          studyTime: progress.formattedStudyTime,
          lastAccessed: progress.lastAccessedLesson?.accessedAt,
          nextLesson,
          totalNotes: progress.notes.length,
          totalBookmarks: progress.bookmarks.length
        };
      })
    );

    // Get overall study statistics
    const studyStats = await Progress.getStudyStats(req.user.id);

    res.json({
      success: true,
      data: {
        courses: progressWithStats,
        overallStats: studyStats[0] || {
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
      message: 'Error fetching progress overview',
      error: error.message
    });
  }
});

// Record quiz score
router.post('/quiz/:lessonId', authMiddleware, [
  body('courseId').isMongoId(),
  body('score').isNumeric().custom(value => value >= 0 && value <= 100),
  body('totalQuestions').isInt({ min: 1 }),
  body('correctAnswers').isInt({ min: 0 }),
  body('timeSpent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { lessonId } = req.params;
    const { courseId, score, totalQuestions, correctAnswers, timeSpent = 0 } = req.body;

    // Check access
    const hasAccess = await Enrollment.hasAccess(req.user.id, courseId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No access to this course'
      });
    }

    const progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    const quizResult = await progress.recordQuizScore(
      lessonId,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent
    );

    res.status(201).json({
      success: true,
      message: 'Quiz score recorded successfully',
      data: quizResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording quiz score',
      error: error.message
    });
  }
});

// Get study analytics for user
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const studyStats = await Progress.getStudyStats(req.user.id, period);

    // Get progress across all courses
    const allProgress = await Progress.findByUser(req.user.id);

    const courseProgress = await Promise.all(
      allProgress.map(async (progress) => {
        const completionPercentage = await progress.getCompletionPercentage();
        return {
          courseId: progress.course._id,
          courseTitle: progress.course.title,
          completionPercentage,
          studyTime: progress.studyTime.totalSeconds,
          lastAccessed: progress.lastAccessedLesson?.accessedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        period,
        overallStats: studyStats[0] || {
          totalStudyTime: 0,
          totalCompletedLessons: 0,
          activeCourses: 0,
          totalNotes: 0,
          totalBookmarks: 0
        },
        courseProgress,
        insights: {
          averageStudyTimePerCourse: courseProgress.length > 0
            ? Math.round(courseProgress.reduce((sum, course) => sum + course.studyTime, 0) / courseProgress.length)
            : 0,
          mostActiveDay: null, // Could implement day-of-week analysis
          completionRate: courseProgress.length > 0
            ? Math.round(courseProgress.reduce((sum, course) => sum + course.completionPercentage, 0) / courseProgress.length)
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;