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
} = require('../controllers/reviewController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Admin management routes (must be before /:id)
router.get('/admin/all', protect, adminOnly, getAllReviewsAdmin)
router.get('/admin/stats', protect, adminOnly, getReviewStatsAdmin)

// Public routes
router.get('/featured', getFeaturedReviews)
router.get('/', getPublicReviews)
router.get('/:id', getReviewById)

// Customer authenticated route
router.post('/', protect, createReview)
router.patch('/:id/approve', protect, adminOnly, approveReview)
router.patch('/:id/reject', protect, adminOnly, rejectReview)
router.patch('/:id/featured', protect, adminOnly, toggleFeaturedReview)
router.patch('/:id', protect, adminOnly, updateReviewAdmin)
router.delete('/:id', protect, adminOnly, deleteReview)

module.exports = router
