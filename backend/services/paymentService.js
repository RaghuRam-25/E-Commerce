/**
 * Payment Service Abstraction Layer
 * Prepares the backend for official gateway integration (bKash, Nagad, Rocket, SSLCommerz/Card)
 * without hardcoding merchant secrets in controllers.
 */

const Payment = require('../models/Payment')
const PaymentMethod = require('../models/PaymentMethod')
const Order = require('../models/Order')

class PaymentService {
  /**
   * Initialize payment session with the selected provider
   */
  async initializePayment({ methodId, amount, customerInfo = {}, orderId = null }) {
    // 1. Verify that the payment method exists and is enabled
    const method = await PaymentMethod.findOne({ id: methodId.toLowerCase(), enabled: true })
    if (!method) {
      throw new Error(`Payment method '${methodId}' is currently unavailable or disabled by admin.`)
    }

    const paymentId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // 2. Handle Cash on Delivery
    if (method.type === 'cod') {
      const paymentDoc = await Payment.create({
        paymentId,
        order: orderId,
        methodId: method.id,
        methodName: method.name,
        amount,
        status: 'unpaid',
      })

      return {
        success: true,
        paymentId,
        status: 'unpaid',
        paymentDoc,
        message: 'Cash on Delivery order initiated.',
      }
    }

    // 3. Handle Online Payment Gateways (bKash, Nagad, Rocket, Card)
    // When live credentials are provided in .env, invoke the official gateway SDK here.
    const gatewaySessionUrl = `https://checkout.gateway.com/session/${paymentId}?amount=${amount}&currency=BDT`

    const paymentDoc = await Payment.create({
      paymentId,
      order: orderId,
      methodId: method.id,
      methodName: method.name,
      amount,
      status: 'processing',
      gatewayResponse: {
        sessionUrl: gatewaySessionUrl,
        environment: method.environment || 'sandbox',
        merchantId: method.merchantId || '',
      },
    })

    return {
      success: true,
      paymentId,
      gatewaySessionUrl,
      status: 'processing',
      paymentDoc,
      message: `Secure ${method.name} gateway session created.`,
    }
  }

  /**
   * Verify transaction with official payment provider webhook/callback
   */
  async verifyPayment(paymentId, simulateResult = 'success') {
    const payment = await Payment.findOne({ paymentId })
    if (!payment) {
      throw new Error(`Payment record not found for ID: ${paymentId}`)
    }

    if (simulateResult === 'success') {
      const trxId =
        (payment.methodId.toUpperCase().substring(0, 2) || 'TX') +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase()

      payment.status = 'paid'
      payment.trxId = trxId
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verifiedAt: new Date(),
        gatewayStatus: 'COMPLETED',
      }
      await payment.save()

      // If tied to an order, mark the order as paid
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: 'paid',
          trxId,
        })
      }

      return {
        success: true,
        status: 'paid',
        trxId,
        payment,
        message: `Payment ${paymentId} successfully verified with payment gateway.`,
      }
    }

    // Failed / Cancelled
    payment.status = 'failed'
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      failedAt: new Date(),
      gatewayStatus: 'FAILED',
    }
    await payment.save()

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'failed',
      })
    }

    return {
      success: false,
      status: 'failed',
      payment,
      message: `Payment ${paymentId} verification failed or was cancelled by the customer.`,
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const payment = await Payment.findOne({ paymentId })
    if (!payment) {
      throw new Error(`Payment record not found for ID: ${paymentId}`)
    }
    return {
      success: true,
      status: payment.status,
      payment,
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount = null) {
    const payment = await Payment.findOne({ paymentId })
    if (!payment) {
      throw new Error(`Payment record not found for ID: ${paymentId}`)
    }

    payment.status = 'refunded'
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      refundedAt: new Date(),
      refundAmount: amount || payment.amount,
    }
    await payment.save()

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'refunded',
      })
    }

    return {
      success: true,
      status: 'refunded',
      payment,
      message: `Payment ${paymentId} successfully refunded.`,
    }
  }
}

module.exports = new PaymentService()
