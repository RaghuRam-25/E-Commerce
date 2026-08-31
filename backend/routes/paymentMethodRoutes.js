const express = require('express')
const {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethodStatus,
  reorderPaymentMethods,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

const router = express.Router()

// Public route for storefront checkout
router.get('/', getPaymentMethods)
router.get('/:id', getPaymentMethodById)

// Admin management routes
router.post('/', protect, authorize('admin', 'super_admin'), createPaymentMethod)
router.patch('/order', protect, authorize('admin', 'super_admin'), reorderPaymentMethods)
router.patch('/:id', protect, authorize('admin', 'super_admin'), updatePaymentMethod)
router.post('/:id/enable', protect, authorize('admin', 'super_admin'), togglePaymentMethodStatus)
router.post('/:id/disable', protect, authorize('admin', 'super_admin'), togglePaymentMethodStatus)
router.delete('/:id', protect, authorize('super_admin'), deletePaymentMethod)

module.exports = router
