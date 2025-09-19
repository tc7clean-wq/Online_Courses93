const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  pros: [String], // What they liked
  cons: [String], // What could be improved
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: ['too-easy', 'just-right', 'too-hard'],
    default: 'just-right'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  unhelpfulVotes: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  response: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported'],
    default: 'pending'
  },
  moderationNotes: String,
  reportCount: {
    type: Number,
    default: 0
  },
  tags: [String], // For categorizing feedback
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    editedAt: Date,
    previousContent: String,
    editReason: String
  }]
}, {
  timestamps: true
});

// Compound indexes for better query performance
reviewSchema.index({ course: 1, status: 1 });
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ rating: -1, createdAt: -1 });
reviewSchema.index({ 'helpfulVotes.count': -1 });
reviewSchema.index({ isVerifiedPurchase: 1, status: 1 });

// Virtual for helpful score (helpful - unhelpful)
reviewSchema.virtual('helpfulScore').get(function() {
  return this.helpfulVotes.count - this.unhelpfulVotes.count;
});

// Virtual for total votes
reviewSchema.virtual('totalVotes').get(function() {
  return this.helpfulVotes.count + this.unhelpfulVotes.count;
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  const total = this.totalVotes;
  if (total === 0) return 0;
  return Math.round((this.helpfulVotes.count / total) * 100);
});

// Pre-save middleware
reviewSchema.pre('save', async function(next) {
  // Verify purchase when creating review
  if (this.isNew) {
    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findOne({
      user: this.user,
      course: this.course,
      'paymentDetails.paymentStatus': 'completed'
    });

    this.isVerifiedPurchase = !!enrollment;

    if (enrollment) {
      this.enrollment = enrollment._id;
      // Get completion percentage from enrollment
      this.completionPercentage = enrollment.completionDetails.completionPercentage;
    }
  }

  next();
});

// Post-save middleware to update course stats
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    if (course) {
      await course.updateStats();
    }
  }
});

// Post-remove middleware to update course stats
reviewSchema.post('remove', async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  if (course) {
    await course.updateStats();
  }
});

// Instance methods
reviewSchema.methods.markHelpful = async function(userId) {
  // Remove from unhelpful if exists
  const unhelpfulIndex = this.unhelpfulVotes.users.indexOf(userId);
  if (unhelpfulIndex > -1) {
    this.unhelpfulVotes.users.splice(unhelpfulIndex, 1);
    this.unhelpfulVotes.count = Math.max(0, this.unhelpfulVotes.count - 1);
  }

  // Add to helpful if not already there
  if (!this.helpfulVotes.users.includes(userId)) {
    this.helpfulVotes.users.push(userId);
    this.helpfulVotes.count += 1;
  }

  await this.save();
  return this;
};

reviewSchema.methods.markUnhelpful = async function(userId) {
  // Remove from helpful if exists
  const helpfulIndex = this.helpfulVotes.users.indexOf(userId);
  if (helpfulIndex > -1) {
    this.helpfulVotes.users.splice(helpfulIndex, 1);
    this.helpfulVotes.count = Math.max(0, this.helpfulVotes.count - 1);
  }

  // Add to unhelpful if not already there
  if (!this.unhelpfulVotes.users.includes(userId)) {
    this.unhelpfulVotes.users.push(userId);
    this.unhelpfulVotes.count += 1;
  }

  await this.save();
  return this;
};

reviewSchema.methods.removeVote = async function(userId) {
  // Remove from both helpful and unhelpful
  const helpfulIndex = this.helpfulVotes.users.indexOf(userId);
  if (helpfulIndex > -1) {
    this.helpfulVotes.users.splice(helpfulIndex, 1);
    this.helpfulVotes.count = Math.max(0, this.helpfulVotes.count - 1);
  }

  const unhelpfulIndex = this.unhelpfulVotes.users.indexOf(userId);
  if (unhelpfulIndex > -1) {
    this.unhelpfulVotes.users.splice(unhelpfulIndex, 1);
    this.unhelpfulVotes.count = Math.max(0, this.unhelpfulVotes.count - 1);
  }

  await this.save();
  return this;
};

reviewSchema.methods.addResponse = async function(content, responderId) {
  this.response = {
    content,
    respondedBy: responderId,
    respondedAt: new Date()
  };

  await this.save();
  return this;
};

reviewSchema.methods.editReview = async function(newContent, newTitle, editReason = '') {
  // Save edit history
  this.editHistory.push({
    editedAt: new Date(),
    previousContent: this.content,
    editReason
  });

  this.content = newContent;
  if (newTitle) this.title = newTitle;
  this.isEdited = true;

  await this.save();
  return this;
};

reviewSchema.methods.report = async function() {
  this.reportCount += 1;
  if (this.reportCount >= 3) {
    this.status = 'reported';
  }
  await this.save();
  return this;
};

reviewSchema.methods.approve = async function() {
  this.status = 'approved';
  await this.save();
  return this;
};

reviewSchema.methods.reject = async function(reason = '') {
  this.status = 'rejected';
  this.moderationNotes = reason;
  await this.save();
  return this;
};

// Static methods
reviewSchema.statics.findByCourse = function(courseId, options = {}) {
  const {
    status = 'approved',
    rating = null,
    sortBy = 'helpful',
    limit = 10,
    skip = 0
  } = options;

  const query = { course: courseId, status };
  if (rating) {
    query.rating = rating;
  }

  let sort = {};
  switch (sortBy) {
    case 'helpful':
      sort = { 'helpfulVotes.count': -1, createdAt: -1 };
      break;
    case 'recent':
      sort = { createdAt: -1 };
      break;
    case 'rating-high':
      sort = { rating: -1, createdAt: -1 };
      break;
    case 'rating-low':
      sort = { rating: 1, createdAt: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  return this.find(query)
    .populate('user', 'name avatar')
    .populate('response.respondedBy', 'name')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

reviewSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('course', 'title slug thumbnail')
    .sort({ createdAt: -1 });
};

reviewSchema.statics.getAverageRating = async function(courseId) {
  const result = await this.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result[0].ratingBreakdown.forEach(rating => {
    breakdown[rating] = (breakdown[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    ratingBreakdown: breakdown
  };
};

reviewSchema.statics.getPendingReviews = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: 1 })
    .limit(limit);
};

reviewSchema.statics.getReportedReviews = function(limit = 50) {
  return this.find({ status: 'reported' })
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ reportCount: -1, createdAt: 1 })
    .limit(limit);
};

reviewSchema.statics.getUserVoteStatus = async function(reviewId, userId) {
  const review = await this.findById(reviewId);
  if (!review) return null;

  const hasHelpfulVote = review.helpfulVotes.users.includes(userId);
  const hasUnhelpfulVote = review.unhelpfulVotes.users.includes(userId);

  return {
    hasVoted: hasHelpfulVote || hasUnhelpfulVote,
    voteType: hasHelpfulVote ? 'helpful' : hasUnhelpfulVote ? 'unhelpful' : null
  };
};

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', reviewSchema);