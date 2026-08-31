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
      enum: ['unpaid', 'pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'],
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

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected', 'returned'],
      default: 'pending',
      index: true,
    },

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

module.exports = mongoose.model('Order', orderSchema)
