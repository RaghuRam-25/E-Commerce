const express = require('express')
const {
  placeOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

const router = express.Router()

// Create order (Public / Guest or Authenticated)
router.post('/', (req, res, next) => {
  // Optional auth: if token is present, decode user, otherwise proceed
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return protect(req, res, next)
  }
  next()
}, placeOrder)

// User and Admin Orders
router.get('/', protect, getOrders)
router.get('/my', protect, getMyOrders)
router.get('/:id', protect, getOrderById)
router.patch('/:id/status', protect, authorize('admin', 'super_admin'), updateOrderStatus)
router.put('/:id/status', protect, authorize('admin', 'super_admin'), updateOrderStatus)

module.exports = router
