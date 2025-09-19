const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  packageType: {
    type: String,
    enum: ['basic', 'premium', 'vip'],
    required: true
  },
  paymentDetails: {
    stripePaymentIntentId: String,
    stripeCustomerId: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer'],
      default: 'card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundReason: String
  },
  enrollmentStatus: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'cancelled'],
    default: 'active'
  },
  accessDetails: {
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date, // For time-limited access if needed
    lastAccessedAt: Date,
    accessCount: {
      type: Number,
      default: 0
    }
  },
  completionDetails: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completionPercentage: {
      type: Number,
      default: 0
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateIssuedAt: Date,
    certificateId: String
  },
  notes: String, // Admin notes about the enrollment
  source: {
    type: String,
    enum: ['direct', 'coupon', 'promotion', 'affiliate', 'gift'],
    default: 'direct'
  },
  couponCode: String,
  affiliateId: String
}, {
  timestamps: true
});

// Compound indexes for better query performance
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, enrollmentStatus: 1 });
enrollmentSchema.index({ user: 1, enrollmentStatus: 1 });
enrollmentSchema.index({ 'paymentDetails.paymentStatus': 1 });
enrollmentSchema.index({ 'accessDetails.grantedAt': -1 });

// Virtual for total revenue
enrollmentSchema.virtual('revenue').get(function() {
  return this.paymentDetails.paymentStatus === 'completed' ? this.paymentDetails.amount : 0;
});

// Pre-save middleware
enrollmentSchema.pre('save', function(next) {
  // Update last accessed when enrollment is accessed
  if (this.isModified('accessDetails.accessCount')) {
    this.accessDetails.lastAccessedAt = new Date();
  }

  // Auto-complete if 100% completion
  if (this.completionDetails.completionPercentage >= 100 && !this.completionDetails.isCompleted) {
    this.completionDetails.isCompleted = true;
    this.completionDetails.completedAt = new Date();
    this.enrollmentStatus = 'completed';
  }

  next();
});

// Instance methods
enrollmentSchema.methods.updateProgress = async function() {
  const Progress = mongoose.model('Progress');
  const Course = mongoose.model('Course');

  const course = await Course.findById(this.course);
  const progress = await Progress.findOne({
    user: this.user,
    course: this.course
  });

  if (progress && course) {
    const completionPercentage = course.totalLessons > 0
      ? Math.round((progress.completedLessons.length / course.totalLessons) * 100)
      : 0;

    this.completionDetails.completionPercentage = completionPercentage;

    if (completionPercentage >= 100) {
      this.completionDetails.isCompleted = true;
      this.completionDetails.completedAt = new Date();
      this.enrollmentStatus = 'completed';
    }

    await this.save();
  }
};

enrollmentSchema.methods.recordAccess = async function() {
  this.accessDetails.accessCount += 1;
  this.accessDetails.lastAccessedAt = new Date();
  await this.save();
};

enrollmentSchema.methods.issueCertificate = async function() {
  if (!this.completionDetails.isCompleted) {
    throw new Error('Course must be completed before issuing certificate');
  }

  if (this.completionDetails.certificateIssued) {
    throw new Error('Certificate already issued for this enrollment');
  }

  // Generate unique certificate ID
  const certificateId = `CERT-${this.course.toString().slice(-8)}-${this.user.toString().slice(-8)}-${Date.now()}`;

  this.completionDetails.certificateIssued = true;
  this.completionDetails.certificateIssuedAt = new Date();
  this.completionDetails.certificateId = certificateId;

  await this.save();

  return certificateId;
};

enrollmentSchema.methods.refund = async function(reason = '') {
  if (this.paymentDetails.paymentStatus === 'refunded') {
    throw new Error('Enrollment already refunded');
  }

  this.paymentDetails.paymentStatus = 'refunded';
  this.paymentDetails.refundedAt = new Date();
  this.paymentDetails.refundReason = reason;
  this.enrollmentStatus = 'cancelled';

  await this.save();
};

// Static methods
enrollmentSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('course', 'title slug thumbnail shortDescription totalDuration totalLessons')
    .sort({ 'accessDetails.grantedAt': -1 });
};

enrollmentSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId })
    .populate('user', 'name email avatar')
    .sort({ 'accessDetails.grantedAt': -1 });
};

enrollmentSchema.statics.getRevenueStats = async function(courseId, startDate, endDate) {
  const matchQuery = {
    'paymentDetails.paymentStatus': 'completed'
  };

  if (courseId) {
    matchQuery.course = new mongoose.Types.ObjectId(courseId);
  }

  if (startDate || endDate) {
    matchQuery['paymentDetails.paidAt'] = {};
    if (startDate) matchQuery['paymentDetails.paidAt'].$gte = new Date(startDate);
    if (endDate) matchQuery['paymentDetails.paidAt'].$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$paymentDetails.amount' },
        totalEnrollments: { $sum: 1 },
        averageOrderValue: { $avg: '$paymentDetails.amount' },
        packageBreakdown: {
          $push: {
            package: '$packageType',
            amount: '$paymentDetails.amount'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalEnrollments: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] }
      }
    }
  ]);

  return stats[0] || {
    totalRevenue: 0,
    totalEnrollments: 0,
    averageOrderValue: 0
  };
};

enrollmentSchema.statics.getEnrollmentTrends = async function(courseId, period = '30d') {
  const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const matchQuery = {
    'accessDetails.grantedAt': { $gte: startDate }
  };

  if (courseId) {
    matchQuery.course = new mongoose.Types.ObjectId(courseId);
  }

  return this.aggregate([
    { $match: matchQuery },
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
};

// Check if user has access to course
enrollmentSchema.statics.hasAccess = async function(userId, courseId) {
  const enrollment = await this.findOne({
    user: userId,
    course: courseId,
    enrollmentStatus: { $in: ['active', 'completed'] },
    'paymentDetails.paymentStatus': 'completed'
  });

  if (!enrollment) return false;

  // Check if access has expired (if expiration is set)
  if (enrollment.accessDetails.expiresAt &&
      enrollment.accessDetails.expiresAt < new Date()) {
    return false;
  }

  return enrollment;
};

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { virtuals: true });
enrollmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);