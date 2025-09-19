// Mock data for demo mode when database is not available

const mockCourses = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'Complete JavaScript Fundamentals',
    slug: 'complete-javascript-fundamentals',
    shortDescription: 'Master JavaScript from basics to advanced concepts with practical examples.',
    longDescription: 'This comprehensive course covers everything you need to know about JavaScript...',
    category: 'technology',
    level: 'beginner',
    price: 4999,
    estimatedDuration: 25,
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
    tags: ['javascript', 'programming', 'web-development'],
    isPublished: true,
    stats: {
      enrollmentCount: 1250,
      averageRating: 4.6,
      totalReviews: 180
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'React for Beginners',
    slug: 'react-for-beginners',
    shortDescription: 'Learn React from scratch and build interactive web applications.',
    longDescription: 'Dive into the world of React development! Perfect for beginners...',
    category: 'technology',
    level: 'intermediate',
    price: 6999,
    estimatedDuration: 35,
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
    tags: ['react', 'javascript', 'frontend'],
    isPublished: true,
    stats: {
      enrollmentCount: 890,
      averageRating: 4.8,
      totalReviews: 134
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Digital Marketing Mastery',
    slug: 'digital-marketing-mastery',
    shortDescription: 'Master digital marketing strategies to grow your business.',
    longDescription: 'Comprehensive digital marketing course covering SEO, social media...',
    category: 'marketing',
    level: 'beginner',
    price: 5999,
    estimatedDuration: 20,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    tags: ['marketing', 'seo', 'social-media'],
    isPublished: true,
    stats: {
      enrollmentCount: 1580,
      averageRating: 4.4,
      totalReviews: 203
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439021',
    name: 'Demo User',
    email: 'demo@learnhub.com',
    role: 'student',
    stats: {
      coursesEnrolled: 3,
      coursesCompleted: 1,
      totalStudyTime: 14400,
      certificatesEarned: 1
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockEnrollments = [
  {
    _id: '507f1f77bcf86cd799439031',
    student: '507f1f77bcf86cd799439021',
    course: '507f1f77bcf86cd799439011',
    enrolledAt: new Date(),
    progress: {
      completedLessons: 5,
      totalLessons: 12,
      completionPercentage: 42,
      lastAccessedAt: new Date()
    }
  }
];

module.exports = {
  mockCourses,
  mockUsers,
  mockEnrollments,

  // Helper functions for mock API responses
  getCourses: (query = {}) => {
    let courses = [...mockCourses];

    if (query.category) {
      courses = courses.filter(course => course.category === query.category);
    }
    if (query.level) {
      courses = courses.filter(course => course.level === query.level);
    }
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      courses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.shortDescription.toLowerCase().includes(searchTerm)
      );
    }

    return {
      success: true,
      data: courses,
      meta: {
        total: courses.length,
        page: 1,
        limit: 12,
        totalPages: 1
      }
    };
  },

  getCourseById: (id) => {
    const course = mockCourses.find(c => c._id === id || c.slug === id);
    if (!course) {
      return { success: false, message: 'Course not found' };
    }
    return { success: true, data: course };
  },

  getUser: (id) => {
    const user = mockUsers.find(u => u._id === id);
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    return { success: true, data: user };
  },

  login: (email, password) => {
    // Demo login - accepts any email/password
    return {
      success: true,
      data: {
        token: 'demo-jwt-token-' + Date.now(),
        user: {
          ...mockUsers[0],
          email: email
        }
      }
    };
  },

  register: (userData) => {
    // Demo registration
    const newUser = {
      _id: 'new-user-' + Date.now(),
      ...userData,
      stats: {
        coursesEnrolled: 0,
        coursesCompleted: 0,
        totalStudyTime: 0,
        certificatesEarned: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: {
        token: 'demo-jwt-token-' + Date.now(),
        user: newUser
      }
    };
  }
};