const PaymentMethod = require('../models/PaymentMethod')

const DEFAULT_METHODS = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    icon: '💵',
    enabled: true,
    displayOrder: 1,
    ctaText: 'Place Order — Cash on Delivery',
    subtitle: 'Pay cash when your package arrives.',
    badge: 'Popular',
  },
  {
    id: 'bkash',
    name: 'bKash',
    type: 'mobile_banking',
    icon: '🌸',
    enabled: true,
    displayOrder: 2,
    environment: 'sandbox',
    merchantId: 'BKASH_DEMO_MERCHANT',
    ctaText: 'Pay with bKash',
    subtitle: 'Direct bKash online payment gateway',
    badge: 'Fast',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    type: 'mobile_banking',
    icon: '🔶',
    enabled: true,
    displayOrder: 3,
    environment: 'sandbox',
    merchantId: 'NAGAD_DEMO_MERCHANT',
    ctaText: 'Pay with Nagad',
    subtitle: 'Direct Nagad online payment gateway',
    badge: 'Fast',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    type: 'mobile_banking',
    icon: '🚀',
    enabled: true,
    displayOrder: 4,
    environment: 'sandbox',
    merchantId: 'ROCKET_DEMO_MERCHANT',
    ctaText: 'Pay with Rocket',
    subtitle: 'Direct DBBL Rocket online payment gateway',
    badge: 'Secure',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    type: 'card',
    icon: '💳',
    enabled: true,
    displayOrder: 5,
    environment: 'sandbox',
    merchantId: 'CARD_GATEWAY_DEMO',
    ctaText: 'Pay Securely',
    subtitle: '256-Bit SSL Encrypted Card Gateway',
    badge: 'Instant',
  },
]

// Helper: Ensure defaults exist
const ensureDefaults = async () => {
  const count = await PaymentMethod.countDocuments()
  if (count === 0) {
    await PaymentMethod.insertMany(DEFAULT_METHODS)
  }
}

// @desc    Get payment methods (public gets enabled only, admin gets all)
// @route   GET /api/payment-methods
// @access  Public
const getPaymentMethods = async (req, res) => {
  try {
    await ensureDefaults()
    const { enabled } = req.query
    const filter = {}

    if (enabled === 'true') {
      filter.enabled = true
    }

    const methods = await PaymentMethod.find(filter).sort({ displayOrder: 1 })
    res.status(200).json({
      success: true,
      count: methods.length,
      paymentMethods: methods,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching payment methods.' })
  }
}

// @desc    Get single payment method
// @route   GET /api/payment-methods/:id
// @access  Public
const getPaymentMethodById = async (req, res) => {
  try {
    const method = await PaymentMethod.findOne({ id: req.params.id.toLowerCase() })
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' })
    }
    res.status(200).json({ success: true, paymentMethod: method })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Create or update payment method
// @route   POST /api/payment-methods, POST /api/admin/payment-methods
// @access  Admin, Super Admin
const createPaymentMethod = async (req, res) => {
  const { id, name, type } = req.body
  if (!id || !name || !type) {
    return res.status(400).json({ success: false, message: 'ID, name, and type are required.' })
  }

  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { id: id.toLowerCase().trim() },
      { ...req.body, id: id.toLowerCase().trim() },
      { upsert: true, new: true, runValidators: true }
    )
    res.status(201).json({ success: true, message: 'Payment method saved.', paymentMethod: method })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating payment method.' })
  }
}

// @desc    Update payment method
// @route   PATCH /api/payment-methods/:id, PATCH /api/admin/payment-methods/:id
// @access  Admin, Super Admin
const updatePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { id: req.params.id.toLowerCase() },
      req.body,
      { new: true, runValidators: true }
    )
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' })
    }
    res.status(200).json({ success: true, message: 'Payment method updated.', paymentMethod: method })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating payment method.' })
  }
}

// @desc    Toggle payment method enabled status
// @route   POST /api/payment-methods/:id/enable, POST /api/payment-methods/:id/disable
// @access  Admin, Super Admin
const togglePaymentMethodStatus = async (req, res) => {
  const isEnableAction = req.path.includes('/enable')
  const enabled = isEnableAction

  try {
    const method = await PaymentMethod.findOneAndUpdate(
      { id: req.params.id.toLowerCase() },
      { enabled },
      { new: true }
    )
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' })
    }
    res.status(200).json({
      success: true,
      message: `${method.name} is now ${enabled ? 'enabled' : 'disabled'}.`,
      paymentMethod: method,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error toggling payment method.' })
  }
}

// @desc    Reorder payment methods
// @route   PATCH /api/payment-methods/order
// @access  Admin, Super Admin
const reorderPaymentMethods = async (req, res) => {
  const { orderedIds } = req.body

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ success: false, message: 'orderedIds array is required.' })
  }

  try {
    const updates = orderedIds.map((id, index) =>
      PaymentMethod.updateOne({ id: id.toLowerCase() }, { displayOrder: index + 1 })
    )
    await Promise.all(updates)
    const all = await PaymentMethod.find().sort({ displayOrder: 1 })
    res.status(200).json({ success: true, message: 'Display order updated.', paymentMethods: all })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error reordering methods.' })
  }
}

// @desc    Delete payment method
// @route   DELETE /api/payment-methods/:id
// @access  Super Admin
const deletePaymentMethod = async (req, res) => {
  try {
    const deleted = await PaymentMethod.findOneAndDelete({ id: req.params.id.toLowerCase() })
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Payment method not found.' })
    }
    res.status(200).json({ success: true, message: 'Payment method deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting payment method.' })
  }
}

module.exports = {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethodStatus,
  reorderPaymentMethods,
  deletePaymentMethod,
}
