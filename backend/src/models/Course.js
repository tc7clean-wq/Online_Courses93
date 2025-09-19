const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  videoDuration: {
    type: Number, // in seconds
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  resources: [{
    title: String,
    fileUrl: String,
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'excel', 'zip', 'other']
    }
  }],
  isPreview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema]
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300
  },
  longDescription: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Courses can be platform-managed without individual instructors
  },
  category: {
    type: String,
    required: true,
    enum: ['business', 'finance', 'technology', 'marketing', 'personal-development', 'other']
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  language: {
    type: String,
    default: 'english'
  },
  thumbnail: {
    type: String,
    required: true
  },
  previewVideo: {
    type: String
  },
  modules: [moduleSchema],

  // Pricing
  pricing: {
    basic: {
      price: {
        type: Number,
        required: true
      },
      priceId: String, // Stripe price ID
      features: [String]
    },
    premium: {
      price: Number,
      priceId: String,
      features: [String]
    },
    vip: {
      price: Number,
      priceId: String,
      features: [String]
    }
  },

  // Course metadata
  totalDuration: {
    type: Number, // in seconds
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },

  // Status and visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [String],

  // Stats
  enrollmentCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },

  // Course requirements and outcomes
  requirements: [String],
  learningOutcomes: [String],
  targetAudience: [String],

  // Additional features
  hasCertificate: {
    type: Boolean,
    default: false
  },
  hasQuizzes: {
    type: Boolean,
    default: false
  },
  hasDownloads: {
    type: Boolean,
    default: false
  },

  // Launch and promotion
  launchDate: Date,
  promotionalPrice: {
    price: Number,
    validUntil: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ slug: 1 });
courseSchema.index({ status: 1, isPublic: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ averageRating: -1, enrollmentCount: -1 });

// Pre-save middleware to calculate totals
courseSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    let totalDuration = 0;
    let totalLessons = 0;

    this.modules.forEach(module => {
      if (module.lessons && module.lessons.length > 0) {
        module.lessons.forEach(lesson => {
          totalDuration += lesson.videoDuration || 0;
          totalLessons += 1;
        });
      }
    });

    this.totalDuration = totalDuration;
    this.totalLessons = totalLessons;
  }
  next();
});

// Virtual for formatted duration
courseSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for course URL
courseSchema.virtual('url').get(function() {
  return `/courses/${this.slug}`;
});

// Methods
courseSchema.methods.updateStats = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');

  // Update enrollment count
  this.enrollmentCount = await Enrollment.countDocuments({ course: this._id });

  // Update average rating and review count
  const reviews = await Review.aggregate([
    { $match: { course: this._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (reviews.length > 0) {
    this.averageRating = Math.round(reviews[0].averageRating * 10) / 10;
    this.reviewCount = reviews[0].reviewCount;
  }

  await this.save();
};

courseSchema.methods.getProgressForUser = async function(userId) {
  const Progress = mongoose.model('Progress');

  const progress = await Progress.findOne({
    user: userId,
    course: this._id
  });

  if (!progress) {
    return {
      completedLessons: [],
      completionPercentage: 0,
      lastAccessedLesson: null
    };
  }

  const completionPercentage = this.totalLessons > 0
    ? Math.round((progress.completedLessons.length / this.totalLessons) * 100)
    : 0;

  return {
    completedLessons: progress.completedLessons,
    completionPercentage,
    lastAccessedLesson: progress.lastAccessedLesson
  };
};

// Static methods
courseSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isPublic: true });
};

courseSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    status: 'published',
    isPublic: true
  }).populate('instructor', 'name avatar');
};

courseSchema.statics.findFeatured = function() {
  return this.find({
    isFeatured: true,
    status: 'published',
    isPublic: true
  }).populate('instructor', 'name avatar');
};

courseSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { status: 'published', isPublic: true },
      {
        $or: [
          { title: new RegExp(query, 'i') },
          { shortDescription: new RegExp(query, 'i') },
          { keywords: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).populate('instructor', 'name avatar');
};

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);