const express = require('express')
const { getDashboardStats } = require('../controllers/adminController')
const {
  adminGetOrders,
  adminGetOrderById,
  adminApproveOrder,
  adminRejectOrder,
  adminUpdateOrderStatus,
  adminMarkOrderPaid,
  adminGetOrderStats,
} = require('../controllers/adminOrderController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

const router = express.Router()

router.use(protect)
router.use(authorize('admin', 'super_admin'))

router.get('/dashboard/stats', getDashboardStats)

router.get('/orders/stats', adminGetOrderStats)
router.get('/orders', adminGetOrders)
router.get('/orders/:id', adminGetOrderById)
router.patch('/orders/:id/approve', adminApproveOrder)
router.patch('/orders/:id/reject', adminRejectOrder)
router.patch('/orders/:id/status', adminUpdateOrderStatus)
router.patch('/orders/:id/payment', adminMarkOrderPaid)

module.exports = router
