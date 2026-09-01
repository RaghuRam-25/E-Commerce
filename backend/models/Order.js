const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: { type: String, required: true },
    productImage: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true }
)

// ── Order status constants (single source of truth) ─────────────
const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'approved',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
  'returned',
]

// Allowed status transitions (business rules).
// Forward flow: pending -> approved -> processing -> shipped -> out_for_delivery -> delivered
const STATUS_TRANSITIONS = {
  pending: ['approved', 'cancelled', 'rejected'],
  confirmed: ['processing', 'cancelled'],
  approved: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  rejected: [],
  returned: [],
}

// ── Payment status constants ─────────────────────────────────────
const PAYMENT_STATUSES = [
  'unpaid',
  'partially_paid',
  'paid',
  'pending',
  'processing',
  'failed',
  'cancelled',
  'refunded',
]

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Customer contact details at time of order
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },

    // Immutable snapshot of delivery address
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      addressLine: { type: String },
      city: { type: String },
      district: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'Bangladesh' },
    },

    // Legacy address fields for backward compatibility
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, 'Order must have at least one item'],
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 60 },
    deliveryFee: { type: Number, default: 60 },

    // Cash on Delivery / Courier charge applied at order time (configured by Admin)
    codCharge: { type: Number, default: 0 },

    total: { type: Number, required: true },

    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      default: 'cod',
    },
    paymentMethodName: {
      type: String,
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    trxId: {
      type: String,
      default: '',
    },

    // ── Structured payment information (Requirement 12) ──────────
    payment: {
      method: { type: String, default: 'cod' },
      status: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: 'unpaid',
      },
      paidAmount: { type: Number, default: 0 },
      remainingAmount: { type: Number, default: 0 },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date },
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },

    // ── Order status history (Requirement 3) ──────────────────────
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByRole: { type: String, default: 'customer' },
        changedByName: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      default: '',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },

    activity: [
      {
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        byName: { type: String, default: '' },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    notes: { type: String, default: '' },
    orderDate: { type: String },
  },
  {
    timestamps: true,
  }
)

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `ORD-${String(count + 1001).padStart(5, '0')}`
  }
  if (!this.orderDate) {
    this.orderDate = new Date().toISOString().split('T')[0]
  }
  if (!this.deliveryFee && this.deliveryCharge) {
    this.deliveryFee = this.deliveryCharge
  }
  next()
})

// Seed initial status history when an order is first created
orderSchema.pre('save', function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.status || 'pending',
        changedBy: this.user,
        changedByRole: 'customer',
        changedByName: this.customerName || 'Customer',
        changedAt: new Date(),
        note: 'Order placed',
      },
    ]
  }
  next()
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
module.exports.ORDER_STATUSES = ORDER_STATUSES
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS
