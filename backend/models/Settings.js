const mongoose = require('mongoose')

// ── Store-level settings (Shipping & COD) ─────────────────────────
// A single settings document keyed by 'shipping_cod'. All monetary
// values are calculated and validated on the backend, never trusted
// from the client.

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    // ── Cash on Delivery / Courier settings ─────────────────────
    codEnabled: {
      type: Boolean,
      default: true,
    },
    codCharge: {
      type: Number,
      default: 30,
      min: 0,
    },
    // Minimum amount the customer must pay as a courier/COD charge
    minimumCodCharge: {
      type: Number,
      default: 100,
      min: 0,
    },
    // When true, customers must pay the courier/COD charge upfront
    requireUpfrontCodCharge: {
      type: Boolean,
      default: false,
    },
    // Flat delivery charge applied at checkout (fallback when no per-method rate)
    shippingCharge: {
      type: Number,
      default: 60,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Helper: load (or create with defaults) the singleton shipping/COD settings
settingsSchema.statics.getShippingConfig = async function () {
  let doc = await this.findOne({ key: 'shipping_cod' })
  if (!doc) {
    doc = await this.create({ key: 'shipping_cod' })
  }
  return doc
}

module.exports = mongoose.model('Settings', settingsSchema)
