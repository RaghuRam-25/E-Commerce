const express = require('express')
const router = express.Router()
const {
  createReview,
  getPublicReviews,
  getFeaturedReviews,
  getReviewById,
  getAllReviewsAdmin,
  getReviewStatsAdmin,
  approveReview,
  rejectReview,
  toggleFeaturedReview,
  updateReviewAdmin,
  deleteReview,
  markHelpful,
} = require('../controllers/reviewController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

// Admin management routes (must be before /:id)
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAllReviewsAdmin)
router.get('/admin/stats', protect, authorize('admin', 'super_admin'), getReviewStatsAdmin)

// Public routes
router.get('/featured', getFeaturedReviews)
router.get('/', getPublicReviews)
router.get('/:id', getReviewById)

// Customer authenticated routes
router.post('/', protect, createReview)
router.post('/:id/helpful', protect, markHelpful)

// Admin moderation routes
router.patch('/:id/approve', protect, authorize('admin', 'super_admin'), approveReview)
router.patch('/:id/reject', protect, authorize('admin', 'super_admin'), rejectReview)
router.patch('/:id/featured', protect, authorize('admin', 'super_admin'), toggleFeaturedReview)
router.patch('/:id', protect, authorize('admin', 'super_admin'), updateReviewAdmin)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteReview)

module.exports = router
