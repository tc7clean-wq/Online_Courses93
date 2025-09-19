const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create payment intent for course enrollment
router.post('/create-payment-intent', authMiddleware, [
  body('courseId').isMongoId(),
  body('packageType').isIn(['basic', 'premium', 'vip'])
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

    const { courseId, packageType } = req.body;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published
    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Get pricing
    if (!course.pricing[packageType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package type'
      });
    }

    const amount = Math.round(course.pricing[packageType].price * 100); // Convert to cents

    // Create or get Stripe customer
    let stripeCustomerId = req.user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user.id.toString()
        }
      });
      stripeCustomerId = customer.id;

      // Update user with customer ID
      req.user.subscription = {
        ...req.user.subscription,
        stripeCustomerId
      };
      await req.user.save();
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        courseId: courseId.toString(),
        userId: req.user.id.toString(),
        packageType,
        courseName: course.title
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: course.pricing[packageType].price,
        currency: 'usd',
        course: {
          id: course._id,
          title: course.title,
          thumbnail: course.thumbnail
        },
        package: {
          type: packageType,
          price: course.pricing[packageType].price,
          features: course.pricing[packageType].features
        }
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
});

// Confirm payment and create enrollment
router.post('/confirm-payment', authMiddleware, [
  body('paymentIntentId').notEmpty(),
  body('courseId').isMongoId(),
  body('packageType').isIn(['basic', 'premium', 'vip'])
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

    const { paymentIntentId, courseId, packageType } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Verify metadata matches request
    if (paymentIntent.metadata.courseId !== courseId ||
        paymentIntent.metadata.userId !== req.user.id.toString() ||
        paymentIntent.metadata.packageType !== packageType) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent metadata mismatch'
      });
    }

    // Check if enrollment already exists for this payment
    const existingEnrollment = await Enrollment.findOne({
      'paymentDetails.stripePaymentIntentId': paymentIntentId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment already created for this payment'
      });
    }

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user.id,
      course: courseId,
      packageType,
      paymentDetails: {
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: paymentIntent.customer,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        paymentStatus: 'completed',
        paidAt: new Date()
      }
    });

    await enrollment.save();

    // Create initial progress record
    const progress = new Progress({
      user: req.user.id,
      course: courseId,
      enrollment: enrollment._id
    });

    await progress.save();

    // Update course enrollment count
    await course.updateStats();

    // Update user stats
    await req.user.updateStats();

    res.json({
      success: true,
      message: 'Payment confirmed and enrollment created successfully',
      data: {
        enrollment,
        course: {
          id: course._id,
          title: course.title,
          slug: course.slug
        }
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
});

// Get payment history for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({
      user: req.user.id,
      'paymentDetails.paymentStatus': { $in: ['completed', 'refunded'] }
    })
    .populate('course', 'title slug thumbnail')
    .sort({ 'paymentDetails.paidAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const payments = enrollments.map(enrollment => ({
      id: enrollment._id,
      course: enrollment.course,
      packageType: enrollment.packageType,
      amount: enrollment.paymentDetails.amount,
      currency: enrollment.paymentDetails.currency,
      status: enrollment.paymentDetails.paymentStatus,
      paidAt: enrollment.paymentDetails.paidAt,
      refundedAt: enrollment.paymentDetails.refundedAt,
      paymentIntentId: enrollment.paymentDetails.stripePaymentIntentId
    }));

    const total = await Enrollment.countDocuments({
      user: req.user.id,
      'paymentDetails.paymentStatus': { $in: ['completed', 'refunded'] }
    });

    res.json({
      success: true,
      data: {
        payments,
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
      message: 'Error fetching payment history',
      error: error.message
    });
  }
});

// Request refund
router.post('/refund/:enrollmentId', authMiddleware, [
  body('reason').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason = '' } = req.body;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      user: req.user.id
    }).populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.paymentDetails.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    // Check refund eligibility (e.g., within 30 days)
    const daysSincePurchase = Math.floor(
      (new Date() - enrollment.paymentDetails.paidAt) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase > 30) {
      return res.status(400).json({
        success: false,
        message: 'Refund period has expired (30 days)'
      });
    }

    // Create refund in Stripe
    try {
      const refund = await stripe.refunds.create({
        payment_intent: enrollment.paymentDetails.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          enrollmentId: enrollmentId.toString(),
          userId: req.user.id.toString(),
          refundReason: reason
        }
      });

      // Update enrollment
      await enrollment.refund(reason);

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundId: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      res.status(400).json({
        success: false,
        message: 'Error processing refund with payment provider',
        error: stripeError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing refund request',
      error: error.message
    });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update enrollment if exists
        const enrollment = await Enrollment.findOne({
          'paymentDetails.stripePaymentIntentId': paymentIntent.id
        });

        if (enrollment && enrollment.paymentDetails.paymentStatus === 'pending') {
          enrollment.paymentDetails.paymentStatus = 'completed';
          enrollment.paymentDetails.paidAt = new Date();
          await enrollment.save();
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);

        // Update enrollment status
        const failedEnrollment = await Enrollment.findOne({
          'paymentDetails.stripePaymentIntentId': failedPayment.id
        });

        if (failedEnrollment) {
          failedEnrollment.paymentDetails.paymentStatus = 'failed';
          await failedEnrollment.save();
        }
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object;
        console.log('Chargeback created:', dispute.id);
        // Handle chargeback logic here
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

module.exports = router;