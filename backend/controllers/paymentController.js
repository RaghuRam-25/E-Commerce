const paymentService = require('../services/paymentService')

// @desc    Initialize payment session (POST /api/payments/initialize)
// @access  Public or Authenticated
const initializePayment = async (req, res) => {
  const { methodId, amount, customerInfo, orderId } = req.body

  if (!methodId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Payment method ID and total amount are required.',
    })
  }

  try {
    const result = await paymentService.initializePayment({
      methodId,
      amount,
      customerInfo,
      orderId,
    })
    res.status(200).json(result)
  } catch (error) {
    console.error('Payment initialization error:', error.message)
    res.status(400).json({
      success: false,
      message: error.message || 'Unable to initialize payment session.',
    })
  }
}

// @desc    Verify payment transaction (POST /api/payments/:paymentId/verify)
// @access  Public or Webhook
const verifyPayment = async (req, res) => {
  const { paymentId } = req.params
  const { simulateResult = 'success' } = req.body

  try {
    const result = await paymentService.verifyPayment(paymentId, simulateResult)
    res.status(result.success ? 200 : 400).json(result)
  } catch (error) {
    console.error('Payment verification error:', error.message)
    res.status(400).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    })
  }
}

// @desc    Get payment status (GET /api/payments/:paymentId/status)
// @access  Public or Authenticated
const getPaymentStatus = async (req, res) => {
  const { paymentId } = req.params

  try {
    const result = await paymentService.getPaymentStatus(paymentId)
    res.status(200).json(result)
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || 'Payment record not found.',
    })
  }
}

module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentStatus,
}
