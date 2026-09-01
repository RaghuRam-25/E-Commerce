const express = require('express')
const { createPayment, callback, queryPayment } = require('../controllers/bkashController')

const router = express.Router()

// Create bKash Payment (Returns official bKash checkout URL)
router.post('/create-payment', createPayment)

// Official bKash Callback Endpoint (Redirected from bKash Checkout)
router.get('/callback', callback)

// Query Payment Status
router.post('/query-payment', queryPayment)

module.exports = router
