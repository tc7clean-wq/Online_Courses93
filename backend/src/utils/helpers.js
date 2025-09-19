const crypto = require('crypto');
const slugify = require('slugify');

/**
 * Generate a unique slug for courses
 * @param {string} title - Course title
 * @param {string} instructorId - Instructor ID
 * @returns {string} Unique slug
 */
const generateCourseSlug = (title, instructorId) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  // Add instructor ID suffix to ensure uniqueness
  const instructorSuffix = instructorId.slice(-6);
  return `${baseSlug}-${instructorSuffix}`;
};

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate course completion percentage
 * @param {number} completedLessons - Number of completed lessons
 * @param {number} totalLessons - Total number of lessons
 * @returns {number} Completion percentage
 */
const calculateCompletionPercentage = (completedLessons, totalLessons) => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};

/**
 * Format duration from minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Calculate estimated reading time for text content
 * @param {string} text - Text content
 * @param {number} wordsPerMinute - Reading speed (default: 200 WPM)
 * @returns {number} Estimated reading time in minutes
 */
const calculateReadingTime = (text, wordsPerMinute = 200) => {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
const getPaginationData = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Sanitize HTML content (basic sanitization)
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized.trim();
};

/**
 * Extract video ID from various video platform URLs
 * @param {string} url - Video URL
 * @returns {object} Video platform and ID
 */
const extractVideoId = (url) => {
  const patterns = {
    youtube: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ],
    vimeo: [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ],
    wistia: [
      /wistia\.com\/medias\/([a-zA-Z0-9]+)/,
      /wistia\.net\/embed\/iframe\/([a-zA-Z0-9]+)/
    ]
  };

  for (const [platform, platformPatterns] of Object.entries(patterns)) {
    for (const pattern of platformPatterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform,
          videoId: match[1]
        };
      }
    }
  }

  return null;
};

/**
 * Generate course certificate data
 * @param {object} user - User object
 * @param {object} course - Course object
 * @param {Date} completionDate - Completion date
 * @returns {object} Certificate data
 */
const generateCertificateData = (user, course, completionDate = new Date()) => {
  const certificateId = `CERT-${Date.now()}-${user._id.toString().slice(-6)}`;

  return {
    certificateId,
    student: {
      name: user.name,
      email: user.email
    },
    course: {
      title: course.title,
      instructor: course.instructor.name,
      duration: course.duration
    },
    completionDate,
    issueDate: new Date(),
    verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate/${certificateId}`
  };
};

/**
 * Calculate course analytics
 * @param {Array} enrollments - Course enrollments
 * @param {Array} reviews - Course reviews
 * @returns {object} Analytics data
 */
const calculateCourseAnalytics = (enrollments, reviews) => {
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.completed).length;
  const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length
  };

  return {
    enrollment: {
      total: totalEnrollments,
      completed: completedEnrollments,
      completionRate: Math.round(completionRate * 100) / 100
    },
    reviews: {
      total: totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      distribution: ratingDistribution
    }
  };
};

/**
 * Format currency amount
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  return formatter.format(amount / 100);
};

/**
 * Generate search keywords from course data
 * @param {object} course - Course object
 * @returns {Array} Search keywords
 */
const generateSearchKeywords = (course) => {
  const keywords = new Set();

  // Add title words
  course.title.toLowerCase().split(/\s+/).forEach(word => {
    if (word.length > 2) keywords.add(word);
  });

  // Add description words (first 100 words)
  const descWords = course.description.toLowerCase()
    .split(/\s+/)
    .slice(0, 100)
    .filter(word => word.length > 3);
  descWords.forEach(word => keywords.add(word));

  // Add category and level
  keywords.add(course.category.toLowerCase());
  keywords.add(course.level.toLowerCase());

  // Add tags
  if (course.tags) {
    course.tags.forEach(tag => keywords.add(tag.toLowerCase()));
  }

  // Add instructor name
  if (course.instructor && course.instructor.name) {
    course.instructor.name.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word);
    });
  }

  return Array.from(keywords);
};

/**
 * Validate and parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed JSON or default value
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate API response format
 * @param {boolean} success - Success status
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {object} meta - Additional metadata
 * @returns {object} Formatted API response
 */
const apiResponse = (success, data = null, message = null, meta = null) => {
  const response = { success };

  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (meta) response.meta = meta;

  return response;
};

module.exports = {
  generateCourseSlug,
  generateToken,
  calculateCompletionPercentage,
  formatDuration,
  calculateReadingTime,
  getPaginationData,
  sanitizeHtml,
  extractVideoId,
  generateCertificateData,
  calculateCourseAnalytics,
  formatCurrency,
  generateSearchKeywords,
  safeJsonParse,
  debounce,
  apiResponse
};