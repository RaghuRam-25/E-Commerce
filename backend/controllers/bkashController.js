const bkashService = require('../services/bkashService')
const Order = require('../models/Order')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// @desc    Create bKash Payment & get official checkout URL
// @route   POST /api/bkash/create-payment
// @access  Public or Authenticated
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required.',
      })
    }

    // 1. Fetch Order from MongoDB to calculate/verify actual payable amount (Requirement 7)
    let order = null
    try {
      order = await Order.findOne({
        $or: [{ _id: orderId }, { orderNumber: orderId }],
      })
    } catch (e) {}

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order '${orderId}' not found.`,
      })
    }

    // 2. Prevent duplicate payment processing (Requirement 7)
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid.',
      })
    }

    // 3. Verify server-side total amount
    const payableAmount = order.total

    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total amount.',
      })
    }

    // 4. Check for missing or placeholder credentials (Requirement 9)
    if (!bkashService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message:
          'bKash API credentials are not configured. Please set valid BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, and BKASH_PASSWORD in backend/.env file.',
      })
    }

    // 5. Initialize payment with official bKash Tokenized Checkout API
    const result = await bkashService.createPayment({
      amount: payableAmount,
      orderId: order._id.toString(),
      payerReference: order.customerPhone || '01700000000',
    })

    res.status(200).json({
      success: true,
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
    })
  } catch (error) {
    console.error('bKash createPayment controller error:', error.message)
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to initialize bKash payment.',
    })
  }
}

// @desc    Official bKash Callback Endpoint (Redirected from bKash Checkout)
// @route   GET /api/bkash/callback
// @access  Public (bKash redirect)
const callback = async (req, res) => {
  const { paymentID, status, orderId } = req.query

  console.log(`bKash Callback Received: status=${status}, paymentID=${paymentID}, orderId=${orderId}`)

  if (status === 'cancel' || status === 'failure') {
    if (orderId) {
      try {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed',
          status: 'pending',
        })
      } catch (e) {}
    }
    return res.redirect(
      `${FRONTEND_URL}/checkout?paymentStatus=failed&reason=${encodeURIComponent(
        status === 'cancel' ? 'Payment was cancelled by user.' : 'bKash payment failed.'
      )}`
    )
  }

  if (status === 'success') {
    try {
      // Execute payment with bKash API to finalize transaction
      const execResult = await bkashService.executePayment(paymentID)

      if (
        execResult.statusCode === '0000' &&
        (execResult.transactionStatus === 'Completed' || execResult.trxID)
      ) {
        const trxId = execResult.trxID || 'BK' + Date.now()

        // Update Order in database to paid
        let orderDoc = null
        if (orderId) {
          orderDoc = await Order.findById(orderId)
          if (orderDoc) {
            orderDoc.paymentMethod = 'bkash'
            orderDoc.paymentMethodName = 'bKash'
            orderDoc.trxId = trxId
            orderDoc.paymentId = paymentID
            orderDoc.paymentStatus = 'paid'
            orderDoc.payment = {
              method: 'bkash',
              status: 'paid',
              paidAmount: orderDoc.total,
              remainingAmount: 0,
              transactionId: trxId,
              paidAt: new Date(),
            }
            // Order stays pending until admin approves it
            if (!orderDoc.status || orderDoc.status === 'pending') {
              orderDoc.status = 'pending'
            }
            orderDoc.activity.push({
              action: 'Payment received via bKash',
              by: orderDoc.user,
              byName: orderDoc.customerName || 'Customer',
              note: `bKash transaction ${trxId}`,
              timestamp: new Date(),
            })
            await orderDoc.save()
          }
        }

        const successOrderNumber = orderDoc ? orderDoc.orderNumber : orderId
        return res.redirect(
          `${FRONTEND_URL}/checkout?paymentStatus=paid&orderId=${successOrderNumber}&trxId=${trxId}&amount=${
            execResult.amount || ''
          }`
        )
      } else {
        console.error('bKash execution failed:', execResult)
        return res.redirect(
          `${FRONTEND_URL}/checkout?paymentStatus=failed&reason=${encodeURIComponent(
            execResult.statusMessage || 'Payment execution failed'
          )}`
        )
      }
    } catch (error) {
      console.error('bKash callback execution error:', error.message)
      return res.redirect(
        `${FRONTEND_URL}/checkout?paymentStatus=failed&reason=${encodeURIComponent(
          error.message || 'Payment execution error'
        )}`
      )
    }
  }

  res.redirect(`${FRONTEND_URL}/checkout`)
}

// @desc    Query bKash payment status manually
// @route   POST /api/bkash/query-payment
// @access  Public
const queryPayment = async (req, res) => {
  try {
    const { paymentID } = req.body
    if (!paymentID) {
      return res.status(400).json({ success: false, message: 'paymentID is required.' })
    }

    const result = await bkashService.queryPayment(paymentID)
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error querying payment.' })
  }
}

module.exports = {
  createPayment,
  callback,
  queryPayment,
}
