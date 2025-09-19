const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
require('dotenv').config();

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@learnhub.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        bio: 'Platform administrator',
        title: 'System Administrator'
      }
    });

    // Create sample student
    const studentUser = await User.create({
      name: 'John Doe',
      email: 'student@learnhub.com',
      password: 'student123',
      role: 'student',
      profile: {
        bio: 'Enthusiastic learner',
        title: 'Software Developer'
      }
    });

    console.log('👥 Created users');

    // Create comprehensive courses
    const courses = [
      {
        title: 'Complete JavaScript Fundamentals',
        slug: 'complete-javascript-fundamentals',
        shortDescription: 'Master JavaScript from basics to advanced concepts with practical examples and projects.',
        longDescription: 'This comprehensive course covers everything you need to know about JavaScript. Starting from basic syntax and concepts, you\'ll progress through advanced topics like closures, promises, async/await, and modern ES6+ features. Perfect for beginners and those looking to solidify their JavaScript knowledge.',
        category: 'technology',
        level: 'beginner',
        language: 'english',
        price: 4999, // $49.99
        estimatedDuration: 25,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
        tags: ['javascript', 'programming', 'web-development', 'frontend'],
        requirements: ['Basic computer skills', 'Text editor or IDE'],
        whatYouWillLearn: [
          'JavaScript fundamentals and syntax',
          'DOM manipulation and events',
          'Asynchronous programming with promises',
          'Modern ES6+ features',
          'Object-oriented programming concepts',
          'Functional programming basics'
        ],
        modules: [
          {
            title: 'Getting Started with JavaScript',
            description: 'Introduction to JavaScript and setting up your development environment.',
            order: 1,
            lessons: [
              {
                title: 'What is JavaScript?',
                description: 'Understanding JavaScript and its role in web development.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 480,
                order: 1,
                isPreview: true,
                resources: [
                  {
                    title: 'JavaScript Cheat Sheet',
                    fileUrl: '#',
                    fileType: 'pdf'
                  }
                ]
              },
              {
                title: 'Setting Up Your Development Environment',
                description: 'Installing Node.js, VS Code, and essential extensions.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 720,
                order: 2,
                resources: []
              },
              {
                title: 'Your First JavaScript Program',
                description: 'Writing and running your first JavaScript code.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 600,
                order: 3,
                resources: []
              }
            ]
          },
          {
            title: 'JavaScript Fundamentals',
            description: 'Core JavaScript concepts including variables, functions, and control structures.',
            order: 2,
            lessons: [
              {
                title: 'Variables and Data Types',
                description: 'Understanding different data types and how to work with variables.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 900,
                order: 1,
                resources: []
              },
              {
                title: 'Functions and Scope',
                description: 'Creating functions and understanding scope in JavaScript.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 1080,
                order: 2,
                resources: []
              }
            ]
          }
        ],
        isPublished: true,
        publishedAt: new Date(),
        stats: {
          enrollmentCount: 1250,
          completionRate: 78,
          averageRating: 4.6,
          totalReviews: 180
        }
      },
      {
        title: 'React for Beginners - Build Modern Web Apps',
        slug: 'react-for-beginners',
        shortDescription: 'Learn React from scratch and build interactive web applications with confidence.',
        longDescription: 'Dive into the world of React development! This course is designed for beginners who want to learn React from the ground up. You\'ll build several projects, understand component lifecycle, state management, and modern React patterns including hooks.',
        category: 'technology',
        level: 'intermediate',
        language: 'english',
        price: 6999, // $69.99
        estimatedDuration: 35,
        thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400',
        tags: ['react', 'javascript', 'frontend', 'components'],
        requirements: ['Basic JavaScript knowledge', 'HTML & CSS fundamentals'],
        whatYouWillLearn: [
          'React fundamentals and JSX',
          'Component creation and composition',
          'State management with hooks',
          'Event handling and forms',
          'API integration',
          'Deployment strategies'
        ],
        modules: [
          {
            title: 'Introduction to React',
            description: 'Understanding React and its ecosystem.',
            order: 1,
            lessons: [
              {
                title: 'What is React?',
                description: 'Introduction to React and why it\'s popular.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 540,
                order: 1,
                isPreview: true,
                resources: []
              }
            ]
          }
        ],
        isPublished: true,
        publishedAt: new Date(),
        stats: {
          enrollmentCount: 890,
          completionRate: 82,
          averageRating: 4.8,
          totalReviews: 134
        }
      },
      {
        title: 'Digital Marketing Mastery',
        slug: 'digital-marketing-mastery',
        shortDescription: 'Master digital marketing strategies to grow your business and reach your target audience.',
        longDescription: 'Comprehensive digital marketing course covering SEO, social media marketing, content marketing, email marketing, and paid advertising. Learn to create effective marketing campaigns that drive results.',
        category: 'marketing',
        level: 'beginner',
        language: 'english',
        price: 5999, // $59.99
        estimatedDuration: 20,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        tags: ['marketing', 'seo', 'social-media', 'advertising'],
        requirements: ['Basic computer skills', 'Interest in marketing'],
        whatYouWillLearn: [
          'Digital marketing fundamentals',
          'SEO and content optimization',
          'Social media marketing strategies',
          'Email marketing campaigns',
          'Paid advertising (Google Ads, Facebook Ads)',
          'Analytics and performance tracking'
        ],
        modules: [
          {
            title: 'Digital Marketing Fundamentals',
            description: 'Understanding the digital marketing landscape.',
            order: 1,
            lessons: [
              {
                title: 'Introduction to Digital Marketing',
                description: 'Overview of digital marketing channels and strategies.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 660,
                order: 1,
                isPreview: true,
                resources: []
              }
            ]
          }
        ],
        isPublished: true,
        publishedAt: new Date(),
        stats: {
          enrollmentCount: 1580,
          completionRate: 71,
          averageRating: 4.4,
          totalReviews: 203
        }
      },
      {
        title: 'Python Programming for Data Science',
        slug: 'python-data-science',
        shortDescription: 'Learn Python programming specifically for data science applications and analysis.',
        longDescription: 'Master Python for data science with this comprehensive course. Learn pandas, numpy, matplotlib, and scikit-learn while working on real-world data science projects.',
        category: 'technology',
        level: 'intermediate',
        language: 'english',
        price: 7999, // $79.99
        estimatedDuration: 40,
        thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
        tags: ['python', 'data-science', 'analytics', 'machine-learning'],
        requirements: ['Basic programming knowledge', 'High school mathematics'],
        whatYouWillLearn: [
          'Python fundamentals for data science',
          'Data manipulation with pandas',
          'Data visualization with matplotlib',
          'Statistical analysis',
          'Machine learning basics',
          'Real-world data projects'
        ],
        modules: [
          {
            title: 'Python Basics for Data Science',
            description: 'Getting started with Python for data analysis.',
            order: 1,
            lessons: [
              {
                title: 'Python Installation and Setup',
                description: 'Setting up Python environment for data science.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 480,
                order: 1,
                isPreview: true,
                resources: []
              }
            ]
          }
        ],
        isPublished: true,
        publishedAt: new Date(),
        stats: {
          enrollmentCount: 750,
          completionRate: 85,
          averageRating: 4.7,
          totalReviews: 98
        }
      },
      {
        title: 'Business Strategy and Leadership',
        slug: 'business-strategy-leadership',
        shortDescription: 'Develop essential business strategy and leadership skills for career advancement.',
        longDescription: 'Learn fundamental business strategy concepts and leadership skills. This course covers strategic thinking, team management, decision-making, and organizational development.',
        category: 'business',
        level: 'intermediate',
        language: 'english',
        price: 8999, // $89.99
        estimatedDuration: 30,
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        tags: ['business', 'leadership', 'strategy', 'management'],
        requirements: ['Work experience preferred', 'Interest in business development'],
        whatYouWillLearn: [
          'Strategic thinking and planning',
          'Leadership principles and styles',
          'Team building and management',
          'Decision-making frameworks',
          'Communication and negotiation',
          'Change management'
        ],
        modules: [
          {
            title: 'Introduction to Business Strategy',
            description: 'Understanding strategic thinking in business context.',
            order: 1,
            lessons: [
              {
                title: 'What is Business Strategy?',
                description: 'Fundamentals of business strategy and its importance.',
                videoUrl: 'https://www.youtube.com/embed/DHjqpvDnNGE',
                videoDuration: 720,
                order: 1,
                isPreview: true,
                resources: []
              }
            ]
          }
        ],
        isPublished: true,
        publishedAt: new Date(),
        stats: {
          enrollmentCount: 630,
          completionRate: 76,
          averageRating: 4.5,
          totalReviews: 87
        }
      }
    ];

    await Course.insertMany(courses);
    console.log('📚 Created sample courses');

    console.log('✅ Sample data seeded successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@learnhub.com / admin123');
    console.log('Student: student@learnhub.com / student123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Run if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://demo:demo123@cluster0.mongodb.net/online-courses?retryWrites=true&w=majority')
    .then(() => {
      console.log('🔗 Connected to MongoDB');
      return seedData();
    })
    .then(() => {
      mongoose.disconnect();
      console.log('🔚 Database connection closed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed to seed data:', error);
      process.exit(1);
    });
}

module.exports = seedData;