/**
 * Shipping / COD calculation helpers.
 *
 * All monetary calculations for an order are performed on the backend.
 * The client can only pass the raw selection (payment method, items),
 * never the financial totals.
 */

const Settings = require('../models/Settings')

/**
 * Compute the delivery + COD financial breakdown for an order.
 *
 * @param {object} opts
 * @param {number} opts.subtotal         - product subtotal (already computed server-side)
 * @param {number} opts.discount         - discount amount (>= 0)
 * @param {string} opts.paymentMethod    - 'cod' | 'bkash' | ...
 * @param {object} [opts.config]         - pre-loaded shipping config (optional)
 *
 * @returns {Promise<{
 *   shippingCharge: number,
 *   codCharge: number,
 *   paidUpfront: number,
 *   remainingAmount: number,
 *   orderTotal: number,
 *   isCod: boolean,
 * }>}
 */
async function calculateOrderAmounts({ subtotal, discount = 0, paymentMethod, config = null }) {
  const cfg = config || (await Settings.getShippingConfig())
  const isCod = String(paymentMethod || '').toLowerCase() === 'cod'

  const shippingCharge = Number(cfg.shippingCharge || 0)
  const codCharge = isCod ? Number(cfg.codCharge || 0) : 0

  const orderTotal = Math.max(subtotal + shippingCharge + codCharge - discount, 0)

  let paidUpfront = 0
  let remainingAmount = orderTotal

  if (isCod) {
    if (cfg.requireUpfrontCodCharge) {
      // Customer pays the courier/COD charge upfront; product + shipping remain on delivery.
      paidUpfront = Math.min(codCharge || shippingCharge || 0, orderTotal)
    } else {
      // Nothing paid upfront; the full order total is collected on delivery.
      paidUpfront = 0
    }
    remainingAmount = orderTotal - paidUpfront
  } else {
    // Prepaid online orders are paid in full upfront.
    paidUpfront = orderTotal
    remainingAmount = 0
  }

  return {
    shippingCharge,
    codCharge,
    paidUpfront,
    remainingAmount,
    orderTotal,
    isCod,
  }
}

module.exports = {
  calculateOrderAmounts,
}
