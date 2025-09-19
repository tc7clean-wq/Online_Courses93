const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

// Vote on review helpfulness
router.post('/:id/vote', authMiddleware, [
  body('type').isIn(['helpful', 'unhelpful', 'remove'])
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

    const { id } = req.params;
    const { type } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // User cannot vote on their own review
    if (review.user.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on your own review'
      });
    }

    switch (type) {
      case 'helpful':
        await review.markHelpful(req.user.id);
        break;
      case 'unhelpful':
        await review.markUnhelpful(req.user.id);
        break;
      case 'remove':
        await review.removeVote(req.user.id);
        break;
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulVotes: review.helpfulVotes.count,
        unhelpfulVotes: review.unhelpfulVotes.count,
        helpfulScore: review.helpfulScore
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording vote',
      error: error.message
    });
  }
});

// Edit review
router.put('/:id', authMiddleware, [
  body('title').optional().notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('content').optional().notEmpty().trim().isLength({ min: 10, max: 2000 }),
  body('rating').optional().isInt({ min: 1, max: 5 })
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

    const { id } = req.params;
    const { title, content, rating, editReason } = req.body;

    const review = await Review.findOne({
      _id: id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Update fields
    if (title) review.title = title;
    if (content) {
      await review.editReview(content, title, editReason);
    }
    if (rating) review.rating = rating;

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// Delete review
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOne({
      _id: id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    await Review.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// Report review
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.report();

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
});

// Get user's reviews
router.get('/my-reviews', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.findByUser(req.user.id);

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// Admin routes
router.get('/admin/pending', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const reviews = await Review.getPendingReviews(parseInt(limit));

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending reviews',
      error: error.message
    });
  }
});

router.get('/admin/reported', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const reviews = await Review.getReportedReviews(parseInt(limit));

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reported reviews',
      error: error.message
    });
  }
});

router.post('/:id/approve', authMiddleware, roleCheck(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.approve();

    res.json({
      success: true,
      message: 'Review approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving review',
      error: error.message
    });
  }
});

router.post('/:id/reject', authMiddleware, roleCheck(['admin']), [
  body('reason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.reject(reason);

    res.json({
      success: true,
      message: 'Review rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting review',
      error: error.message
    });
  }
});

module.exports = router;