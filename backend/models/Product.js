const mongoose = require('mongoose')

/**
 * Normalize a product's image data into a consistent object array:
 *   [{ url, publicId, order, isPrimary }]
 *
 * Accepts:
 *   - images: [{ url, publicId, order, isPrimary }]   (new object format)
 *   - images: ['url1', 'url2']                        (legacy string array)
 *   - image:  'url'                                   (legacy single image field)
 */
const normalizeImages = (images, legacyImage) => {
  let raw = []

  if (Array.isArray(images)) {
    raw = images
  } else if (typeof images === 'string' && images) {
    raw = [images]
  }

  // Build object entries
  const entries = raw.map((img, index) => {
    if (img && typeof img === 'object') {
      return {
        url: img.url || '',
        publicId: img.publicId || img.public_id || '',
        order: typeof img.order === 'number' ? img.order : index,
        isPrimary: Boolean(img.isPrimary),
      }
    }
    // Legacy string entry
    return {
      url: img || '',
      publicId: '',
      order: index,
      isPrimary: false,
    }
  })

  // Fall back to the legacy single `image` field if no images exist
  if (entries.length === 0 && legacyImage) {
    entries.push({
      url: legacyImage,
      publicId: '',
      order: 0,
      isPrimary: true,
    })
  }

  // Enforce ordering by the `order` value, then re-index to guarantee
  // a continuous 0..n sequence matching the visual order.
  entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const normalized = entries.map((img, index) => ({
    url: img.url,
    publicId: img.publicId || '',
    order: index,
    isPrimary: index === 0 ? true : Boolean(img.isPrimary),
  }))

  // If no image was explicitly marked primary, the first one is primary.
  if (normalized.some((img) => img.isPrimary)) {
    return normalized
  }
  if (normalized.length > 0) {
    normalized[0] = { ...normalized[0], isPrimary: true }
  }

  return normalized
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
    },
    // Multi-image gallery. Stored as an array of objects:
    //   [{ url, publicId, order, isPrimary }]
    // Kept as a Mixed array so legacy string-only products keep reading fine.
    images: {
      type: [],
      default: [],
    },
    // Legacy single-image field (optional) for very old products that only
    // had `image` set. Prefer `images[]`; fall back to `image` otherwise.
    image: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        // Normalize images before serialization so the API always returns
        // object entries with url/publicId/order/isPrimary.
        const normalized = normalizeImages(ret.images, ret.image)
        ret.images = normalized
        // Primary image convenience
        const primary = normalized.find((img) => img.isPrimary) || normalized[0]
        ret.primaryImage = primary?.url || ''
        delete ret.image
        ret.id = ret._id
        return ret
      },
    },
  }
)

// Normalize images on save for new/updated products so storage is always
// object-form and legacy strings are migrated automatically.
productSchema.pre('save', function (next) {
  if (this.isModified('images') || this.isModified('image')) {
    const normalized = normalizeImages(this.images, this.image)
    this.images = normalized
    if (normalized.length > 0) {
      this.image = normalized[0].url
    }
  }
  next()
})

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' })

module.exports = mongoose.model('Product', productSchema)
