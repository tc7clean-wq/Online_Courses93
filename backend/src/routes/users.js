const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all instructors (public)
router.get('/instructors', async (req, res) => {
  try {
    const { limit = 12, sortBy = 'rating' } = req.query;

    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'instructor.averageRating': -1, 'instructor.totalStudents': -1 };
        break;
      case 'students':
        sort = { 'instructor.totalStudents': -1 };
        break;
      case 'courses':
        sort = { 'instructor.coursesCreated': -1 };
        break;
      default:
        sort = { 'instructor.averageRating': -1 };
    }

    const instructors = await User.find({
      role: 'instructor',
      'instructor.isApproved': true,
      isActive: true
    })
    .select('name avatar profile instructor')
    .sort(sort)
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: instructors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching instructors',
      error: error.message
    });
  }
});

// Search users (public, limited info)
router.get('/search', async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.searchUsers(q, role)
      .select('name avatar profile.title role')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
});

// Get user profile by ID (public, limited info)
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name avatar profile role instructor stats createdAt')
      .populate({
        path: 'instructor',
        select: 'bio expertise experience averageRating totalStudents coursesCreated'
      });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only show public profiles
    if (!user.preferences.privacy.showProfile) {
      return res.status(403).json({
        success: false,
        message: 'Profile is private'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Admin routes
router.use(authMiddleware);
router.use(roleCheck(['admin']));

// Get all users (admin only)
router.get('/admin/all', async (req, res) => {
  try {
    const { role, status, page = 1, limit = 50, sortBy = 'createdAt' } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    let sort = {};
    switch (sortBy) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'email':
        sort = { email: 1 };
        break;
      case 'role':
        sort = { role: 1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password -verification')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
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
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await User.getUserStats();

    // Additional stats
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const pendingInstructors = await User.countDocuments({
      role: 'instructor',
      'instructor.isApproved': false,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        ...stats,
        pendingInstructors,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

// Get pending instructor applications
router.get('/admin/pending-instructors', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const pendingInstructors = await User.find({
      role: 'instructor',
      'instructor.isApproved': false,
      isActive: true
    })
    .select('-password -verification')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      role: 'instructor',
      'instructor.isApproved': false,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        instructors: pendingInstructors,
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
      message: 'Error fetching pending instructors',
      error: error.message
    });
  }
});

// Approve instructor
router.post('/admin/:id/approve-instructor', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'instructor') {
      return res.status(400).json({
        success: false,
        message: 'User is not an instructor'
      });
    }

    user.instructor.isApproved = true;
    await user.save();

    res.json({
      success: true,
      message: 'Instructor approved successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving instructor',
      error: error.message
    });
  }
});

// Reject instructor application
router.post('/admin/:id/reject-instructor', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'instructor') {
      return res.status(400).json({
        success: false,
        message: 'User is not an instructor'
      });
    }

    // Reset to student role
    user.role = 'student';
    user.instructor = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Instructor application rejected',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting instructor',
      error: error.message
    });
  }
});

// Deactivate user
router.post('/admin/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
});

// Reactivate user
router.post('/admin/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User reactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reactivating user',
      error: error.message
    });
  }
});

// Update user role
router.put('/admin/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;

    // Reset instructor data if changing from instructor
    if (user.role === 'instructor' && role !== 'instructor') {
      user.instructor = undefined;
    }

    // Initialize instructor data if changing to instructor
    if (role === 'instructor' && user.role !== 'instructor') {
      user.instructor = {
        isApproved: false,
        bio: '',
        expertise: [],
        experience: ''
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

module.exports = router;