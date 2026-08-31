const express = require('express')
const {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/paymentController')

const router = express.Router()

router.post('/initialize', initializePayment)
router.post('/:paymentId/verify', verifyPayment)
router.get('/:paymentId/status', getPaymentStatus)
router.get('/:paymentId', getPaymentStatus)

module.exports = router
