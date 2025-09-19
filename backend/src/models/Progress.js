const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  completedLessons: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    watchTime: {
      type: Number, // in seconds
      default: 0
    },
    watchPercentage: {
      type: Number, // 0-100
      default: 0
    }
  }],
  currentLesson: {
    moduleIndex: {
      type: Number,
      default: 0
    },
    lessonIndex: {
      type: Number,
      default: 0
    },
    lessonId: mongoose.Schema.Types.ObjectId,
    currentTime: {
      type: Number, // in seconds
      default: 0
    }
  },
  lastAccessedLesson: {
    moduleIndex: Number,
    lessonIndex: Number,
    lessonId: mongoose.Schema.Types.ObjectId,
    accessedAt: Date
  },
  studyTime: {
    totalSeconds: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  notes: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    content: String,
    timestamp: Number, // video timestamp in seconds
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    title: String,
    timestamp: Number, // video timestamp in seconds
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizScores: [{
    lessonId: mongoose.Schema.Types.ObjectId,
    score: Number, // 0-100
    totalQuestions: Number,
    correctAnswers: Number,
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number // in seconds
  }],
  preferences: {
    playbackSpeed: {
      type: Number,
      default: 1.0
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    quality: {
      type: String,
      enum: ['auto', '480p', '720p', '1080p'],
      default: 'auto'
    },
    subtitles: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ enrollment: 1 });
progressSchema.index({ 'completedLessons.lessonId': 1 });
progressSchema.index({ updatedAt: -1 });

// Virtual for completion percentage
progressSchema.virtual('completionPercentage').get(function() {
  const Course = mongoose.model('Course');
  // This will be calculated in the methods since we need course data
  return 0;
});

// Virtual for formatted study time
progressSchema.virtual('formattedStudyTime').get(function() {
  const hours = Math.floor(this.studyTime.totalSeconds / 3600);
  const minutes = Math.floor((this.studyTime.totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Pre-save middleware
progressSchema.pre('save', function(next) {
  // Update study time tracking
  if (this.isModified('studyTime.totalSeconds')) {
    this.studyTime.lastUpdated = new Date();
  }

  next();
});

// Instance methods
progressSchema.methods.markLessonComplete = async function(lessonId, watchTime = 0, watchPercentage = 100) {
  // Check if lesson is already completed
  const existingIndex = this.completedLessons.findIndex(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );

  if (existingIndex === -1) {
    // Add new completed lesson
    this.completedLessons.push({
      lessonId,
      completedAt: new Date(),
      watchTime,
      watchPercentage
    });
  } else {
    // Update existing completion record
    this.completedLessons[existingIndex].watchTime = Math.max(
      this.completedLessons[existingIndex].watchTime,
      watchTime
    );
    this.completedLessons[existingIndex].watchPercentage = Math.max(
      this.completedLessons[existingIndex].watchPercentage,
      watchPercentage
    );
  }

  await this.save();

  // Update enrollment progress
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findById(this.enrollment);
  if (enrollment) {
    await enrollment.updateProgress();
  }

  return this;
};

progressSchema.methods.updateCurrentLesson = async function(moduleIndex, lessonIndex, lessonId, currentTime = 0) {
  this.currentLesson = {
    moduleIndex,
    lessonIndex,
    lessonId,
    currentTime
  };

  this.lastAccessedLesson = {
    moduleIndex,
    lessonIndex,
    lessonId,
    accessedAt: new Date()
  };

  await this.save();
  return this;
};

progressSchema.methods.addStudyTime = async function(seconds) {
  this.studyTime.totalSeconds += seconds;
  this.studyTime.lastUpdated = new Date();
  await this.save();
  return this;
};

progressSchema.methods.addNote = async function(lessonId, content, timestamp = 0) {
  this.notes.push({
    lessonId,
    content,
    timestamp,
    createdAt: new Date()
  });

  await this.save();
  return this.notes[this.notes.length - 1];
};

progressSchema.methods.addBookmark = async function(lessonId, title, timestamp) {
  this.bookmarks.push({
    lessonId,
    title,
    timestamp,
    createdAt: new Date()
  });

  await this.save();
  return this.bookmarks[this.bookmarks.length - 1];
};

progressSchema.methods.removeBookmark = async function(bookmarkId) {
  this.bookmarks = this.bookmarks.filter(
    bookmark => bookmark._id.toString() !== bookmarkId.toString()
  );

  await this.save();
  return this;
};

progressSchema.methods.updatePreferences = async function(preferences) {
  this.preferences = { ...this.preferences.toObject(), ...preferences };
  await this.save();
  return this;
};

progressSchema.methods.recordQuizScore = async function(lessonId, score, totalQuestions, correctAnswers, timeSpent) {
  this.quizScores.push({
    lessonId,
    score,
    totalQuestions,
    correctAnswers,
    attemptedAt: new Date(),
    timeSpent
  });

  await this.save();
  return this.quizScores[this.quizScores.length - 1];
};

progressSchema.methods.getCompletionPercentage = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (!course || course.totalLessons === 0) {
    return 0;
  }

  return Math.round((this.completedLessons.length / course.totalLessons) * 100);
};

progressSchema.methods.isLessonCompleted = function(lessonId) {
  return this.completedLessons.some(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );
};

progressSchema.methods.getLessonProgress = function(lessonId) {
  const completed = this.completedLessons.find(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );

  if (!completed) {
    return {
      isCompleted: false,
      watchTime: 0,
      watchPercentage: 0
    };
  }

  return {
    isCompleted: true,
    watchTime: completed.watchTime,
    watchPercentage: completed.watchPercentage,
    completedAt: completed.completedAt
  };
};

progressSchema.methods.getNotesForLesson = function(lessonId) {
  return this.notes.filter(
    note => note.lessonId.toString() === lessonId.toString()
  ).sort((a, b) => a.timestamp - b.timestamp);
};

progressSchema.methods.getBookmarksForLesson = function(lessonId) {
  return this.bookmarks.filter(
    bookmark => bookmark.lessonId.toString() === lessonId.toString()
  ).sort((a, b) => a.timestamp - b.timestamp);
};

progressSchema.methods.getNextLesson = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (!course || !course.modules || course.modules.length === 0) {
    return null;
  }

  // If no current lesson set, return first lesson
  if (!this.currentLesson || !this.currentLesson.lessonId) {
    if (course.modules[0].lessons && course.modules[0].lessons.length > 0) {
      return {
        moduleIndex: 0,
        lessonIndex: 0,
        lesson: course.modules[0].lessons[0]
      };
    }
    return null;
  }

  const currentModuleIndex = this.currentLesson.moduleIndex;
  const currentLessonIndex = this.currentLesson.lessonIndex;

  // Try next lesson in current module
  if (course.modules[currentModuleIndex].lessons[currentLessonIndex + 1]) {
    return {
      moduleIndex: currentModuleIndex,
      lessonIndex: currentLessonIndex + 1,
      lesson: course.modules[currentModuleIndex].lessons[currentLessonIndex + 1]
    };
  }

  // Try first lesson in next module
  if (course.modules[currentModuleIndex + 1] &&
      course.modules[currentModuleIndex + 1].lessons &&
      course.modules[currentModuleIndex + 1].lessons.length > 0) {
    return {
      moduleIndex: currentModuleIndex + 1,
      lessonIndex: 0,
      lesson: course.modules[currentModuleIndex + 1].lessons[0]
    };
  }

  // No next lesson available
  return null;
};

// Static methods
progressSchema.statics.findByUser = function(userId, courseId = null) {
  const query = { user: userId };
  if (courseId) {
    query.course = courseId;
  }

  return this.find(query)
    .populate('course', 'title slug thumbnail')
    .sort({ updatedAt: -1 });
};

progressSchema.statics.getStudyStats = async function(userId, period = '30d') {
  const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        updatedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalStudyTime: { $sum: '$studyTime.totalSeconds' },
        totalCompletedLessons: { $sum: { $size: '$completedLessons' } },
        activeCourses: { $addToSet: '$course' },
        totalNotes: { $sum: { $size: '$notes' } },
        totalBookmarks: { $sum: { $size: '$bookmarks' } }
      }
    },
    {
      $project: {
        _id: 0,
        totalStudyTime: 1,
        totalCompletedLessons: 1,
        activeCourses: { $size: '$activeCourses' },
        totalNotes: 1,
        totalBookmarks: 1
      }
    }
  ]);
};

// Ensure virtual fields are serialized
progressSchema.set('toJSON', { virtuals: true });
progressSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Progress', progressSchema);