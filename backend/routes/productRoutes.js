const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')
const {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  deleteProductImage,
  reorderProductImages,
  setPrimaryProductImage,
} = require('../controllers/productController')
const {
  getProductReviews,
  getProductReviewSummary,
} = require('../controllers/reviewController')

// Public routes (specific routes MUST be before /:id to avoid conflicts)
router.get('/', getProducts)
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAllProductsAdmin)

// Product-scoped review routes (before /:id)
router.get('/:id/related', getRelatedProducts)
router.get('/:id/reviews', getProductReviews)
router.get('/:id/review-summary', getProductReviewSummary)

// Image management routes (before generic /:id)
router.delete('/:id/images/:imageId', protect, authorize('admin', 'super_admin'), deleteProductImage)
router.patch('/:id/images/reorder', protect, authorize('admin', 'super_admin'), reorderProductImages)
router.patch('/:id/images/:imageId/primary', protect, authorize('admin', 'super_admin'), setPrimaryProductImage)

// Generic product by ID
router.get('/:id', getProductById)

// Admin product management
router.post('/', protect, authorize('admin', 'super_admin'), createProduct)
router.put('/:id', protect, authorize('admin', 'super_admin'), updateProduct)
router.patch('/:id', protect, authorize('admin', 'super_admin'), updateProduct)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteProduct)

module.exports = router
