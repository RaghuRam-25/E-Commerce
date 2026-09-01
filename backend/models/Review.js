const mongoose = require('mongoose')

const reviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
)

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Dhaka, Bangladesh',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },
    review: {
      type: String,
      required: false,
      minlength: [0, 'Review must be at least 0 characters long'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    // Review photos (stored as Cloudinary URLs — not binary)
    images: {
      type: [reviewImageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'A review can have a maximum of 5 photos.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Helpful votes
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVoters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Review', reviewSchema)
