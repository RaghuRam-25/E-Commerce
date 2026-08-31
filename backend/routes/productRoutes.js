const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} = require('../controllers/productController')

// Public routes
router.get('/', getProducts)
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAllProductsAdmin)
router.get('/:id', getProductById)

// Admin routes
router.post('/', protect, authorize('admin', 'super_admin'), createProduct)
router.put('/:id', protect, authorize('admin', 'super_admin'), updateProduct)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteProduct)

module.exports = router
