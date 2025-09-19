const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  profile: {
    bio: String,
    title: String, // Professional title
    website: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
      youtube: String
    },
    location: String,
    timezone: String,
    interests: [String]
  },
  preferences: {
    emailNotifications: {
      courseUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newFeatures: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showProgress: { type: Boolean, default: false },
      allowMessages: { type: Boolean, default: true }
    },
    learning: {
      autoplay: { type: Boolean, default: true },
      playbackSpeed: { type: Number, default: 1.0 },
      subtitles: { type: Boolean, default: false },
      language: { type: String, default: 'en' }
    }
  },
  stats: {
    coursesEnrolled: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 }, // in seconds
    certificatesEarned: { type: Number, default: 0 },
    reviewsWritten: { type: Number, default: 0 }
  },
  verification: {
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'lifetime'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    isActive: { type: Boolean, default: true }
  },
  loginActivity: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    lastIP: String,
    deviceInfo: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String] // For admin organization
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'instructor.isApproved': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name (if needed)
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completed = 0;
  const total = 8;

  if (this.name) completed++;
  if (this.avatar) completed++;
  if (this.profile.bio) completed++;
  if (this.profile.title) completed++;
  if (this.profile.location) completed++;
  if (this.profile.interests && this.profile.interests.length > 0) completed++;
  if (this.verification.isEmailVerified) completed++;
  if (this.profile.socialLinks && Object.values(this.profile.socialLinks).some(link => link)) completed++;

  return Math.round((completed / total) * 100);
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Update login activity
  if (this.isModified('loginActivity.lastLogin')) {
    this.loginActivity.loginCount += 1;
  }

  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateStats = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');
  const Progress = mongoose.model('Progress');

  // Update course stats
  const enrollments = await Enrollment.find({ user: this._id });
  this.stats.coursesEnrolled = enrollments.length;
  this.stats.coursesCompleted = enrollments.filter(e => e.enrollmentStatus === 'completed').length;

  // Update certificates
  this.stats.certificatesEarned = enrollments.filter(e => e.completionDetails.certificateIssued).length;

  // Update reviews
  this.stats.reviewsWritten = await Review.countDocuments({ user: this._id, status: 'approved' });

  // Update total study time
  const progressStats = await Progress.aggregate([
    { $match: { user: this._id } },
    { $group: { _id: null, totalTime: { $sum: '$studyTime.totalSeconds' } } }
  ]);
  this.stats.totalStudyTime = progressStats.length > 0 ? progressStats[0].totalTime : 0;

  await this.save();
};

userSchema.methods.updateInstructorStats = async function() {
  if (this.role !== 'instructor') return;

  const Course = mongoose.model('Course');
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');

  // Update courses created
  this.instructor.coursesCreated = await Course.countDocuments({
    instructor: this._id,
    status: 'published'
  });

  // Update total students (unique enrollments across all courses)
  const enrollmentStats = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    {
      $match: {
        'courseInfo.instructor': this._id,
        'paymentDetails.paymentStatus': 'completed'
      }
    },
    {
      $group: {
        _id: '$user'
      }
    },
    {
      $count: 'totalStudents'
    }
  ]);

  this.instructor.totalStudents = enrollmentStats.length > 0 ? enrollmentStats[0].totalStudents : 0;

  // Update total earnings
  const earningsStats = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    {
      $match: {
        'courseInfo.instructor': this._id,
        'paymentDetails.paymentStatus': 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$paymentDetails.amount' }
      }
    }
  ]);

  this.instructor.totalEarnings = earningsStats.length > 0 ? earningsStats[0].totalEarnings : 0;

  // Update average rating
  const ratingStats = await Review.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    {
      $match: {
        'courseInfo.instructor': this._id,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  this.instructor.averageRating = ratingStats.length > 0
    ? Math.round(ratingStats[0].averageRating * 10) / 10
    : 0;

  await this.save();
};

userSchema.methods.recordLogin = async function(ip, deviceInfo) {
  this.loginActivity.lastLogin = new Date();
  this.loginActivity.lastIP = ip;
  this.loginActivity.deviceInfo = deviceInfo;
  await this.save();
};

userSchema.methods.blockUser = async function(userIdToBlock) {
  if (!this.blockedUsers.includes(userIdToBlock)) {
    this.blockedUsers.push(userIdToBlock);
    await this.save();
  }
};

userSchema.methods.unblockUser = async function(userIdToUnblock) {
  this.blockedUsers = this.blockedUsers.filter(
    id => id.toString() !== userIdToUnblock.toString()
  );
  await this.save();
};

userSchema.methods.updatePreferences = async function(newPreferences) {
  // Deep merge preferences
  this.preferences = {
    emailNotifications: { ...this.preferences.emailNotifications, ...newPreferences.emailNotifications },
    privacy: { ...this.preferences.privacy, ...newPreferences.privacy },
    learning: { ...this.preferences.learning, ...newPreferences.learning }
  };
  await this.save();
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.verification.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.verification.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.verification.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.verification.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findInstructors = function(approved = true) {
  return this.find({
    role: 'instructor',
    'instructor.isApproved': approved,
    isActive: true
  }).select('-password -verification');
};

userSchema.statics.searchUsers = function(query, role = null) {
  const searchQuery = {
    isActive: true,
    $or: [
      { name: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') },
      { 'profile.title': new RegExp(query, 'i') }
    ]
  };

  if (role) {
    searchQuery.role = role;
  }

  return this.find(searchQuery).select('-password -verification');
};

userSchema.statics.getUserStats = async function() {
  const totalUsers = await this.countDocuments({ isActive: true });
  const totalStudents = await this.countDocuments({ role: 'student', isActive: true });
  const totalInstructors = await this.countDocuments({ role: 'instructor', isActive: true });
  const verifiedUsers = await this.countDocuments({ 'verification.isEmailVerified': true, isActive: true });

  return {
    totalUsers,
    totalStudents,
    totalInstructors,
    verifiedUsers,
    verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
  };
};

userSchema.statics.getTopInstructors = function(limit = 10) {
  return this.find({
    role: 'instructor',
    'instructor.isApproved': true,
    isActive: true
  })
  .sort({ 'instructor.averageRating': -1, 'instructor.totalStudents': -1 })
  .limit(limit)
  .select('-password -verification');
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verification.passwordResetToken;
  delete user.verification.emailVerificationToken;
  return user;
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);