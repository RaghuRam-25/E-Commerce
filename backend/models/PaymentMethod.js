const mongoose = require('mongoose')

const paymentMethodSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, 'Payment method ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['cod', 'mobile_banking', 'card'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '💳',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    instructions: {
      type: String,
      default: '',
    },
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    merchantId: {
      type: String,
      default: '',
    },
    merchantNumber: {
      type: String,
      default: '',
    },
    accountType: {
      type: String,
      enum: ['Merchant', 'Personal'],
      default: 'Merchant',
    },
    ctaText: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema)
