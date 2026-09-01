const Review = require('../models/Review')
const Order = require('../models/Order')
const { getProductImageUrl } = require('../utils/productImage')

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Check if a user has a delivered order containing a specific product
// ─────────────────────────────────────────────────────────────────────────────
const checkVerifiedPurchase = async (userId, productId) => {
  if (!userId || !productId) return false
  try {
    const mongoose = require('mongoose')
    const productObjId = mongoose.Types.ObjectId.isValid(productId)
      ? new mongoose.Types.ObjectId(productId)
      : null
    if (!productObjId) return false

    const order = await Order.findOne({
      user: userId,
      status: 'delivered',
      'items.productId': productObjId,
    })
    return !!order
  } catch (e) {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit a customer review (supports text, photos, or both)
// @route   POST /api/reviews
// @access  Private (Authenticated Customers)
// ─────────────────────────────────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { review, rating, location, productId, orderId, title, images } = req.body

    // 1. Rating is always required
    const numRating = Number(rating)
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      })
    }

    // 2. Must have at least a text review OR at least one image
    const hasText = review && typeof review === 'string' && review.trim().length >= 10
    const hasImages = Array.isArray(images) && images.length > 0

    if (!hasText && !hasImages) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a review text (min 10 characters) or at least one photo.',
      })
    }

    if (review && review.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 1000 characters.',
      })
    }

    // 3. Validate images array (max 5, must have url and publicId)
    if (hasImages) {
      if (images.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'A review can have a maximum of 5 photos.',
        })
      }
      for (const img of images) {
        if (!img.url || !img.publicId) {
          return res.status(400).json({
            success: false,
            message: 'Each image must have a valid URL and public ID.',
          })
        }
      }
    }

    // 4. Validate title length
    if (title && title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Review title cannot exceed 100 characters.',
      })
    }

    // 5. Prevent duplicate spam (same user, same product, within 5 minutes)
    if (req.user && req.user._id && productId) {
      const recent = await Review.findOne({
        customerId: req.user._id,
        productId: productId,
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      })
      if (recent) {
        return res.status(429).json({
          success: false,
          message: 'You already submitted a review for this product recently.',
        })
      }
    }

    // 6. Auto-detect verified purchase
    const isVerified = await checkVerifiedPurchase(
      req.user ? req.user._id : null,
      productId
    )

    // 7. Create the review
    const newReview = await Review.create({
      customerId: req.user ? req.user._id : undefined,
      customerName: req.user ? req.user.name : 'Valued Customer',
      email: req.user ? req.user.email : undefined,
      avatarUrl: req.user ? req.user.avatar || req.user.profileImage || '' : '',
      location: location && location.trim() ? location.trim() : 'Dhaka, Bangladesh',
      title: title ? title.trim() : '',
      review: review ? review.trim() : '',
      rating: numRating,
      images: hasImages ? images : [],
      status: 'pending',
      isFeatured: false,
      productId: productId || undefined,
      orderId: orderId || undefined,
      isVerifiedPurchase: isVerified,
    })

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted and is pending administrator approval.',
      review: {
        id: newReview._id,
        customerName: newReview.customerName,
        title: newReview.title,
        review: newReview.review,
        rating: newReview.rating,
        images: newReview.images,
        status: newReview.status,
        isVerifiedPurchase: newReview.isVerifiedPurchase,
        createdAt: newReview.createdAt,
      },
    })
  } catch (error) {
    console.error('Create Review Error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting review.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get approved reviews for a specific product (paginated, filtered, sorted)
// @route   GET /api/products/:productId/reviews
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const {
      page = 1,
      limit = 10,
      rating,
      withPhotos,
      sort = 'recent',
    } = req.query

    const query = { productId, status: 'approved' }

    if (rating && rating !== 'all') {
      query.rating = Number(rating)
    }

    if (withPhotos === 'true') {
      query['images.0'] = { $exists: true }
    }

    let sortObj = {}
    switch (sort) {
      case 'highest':
        sortObj = { rating: -1, createdAt: -1 }
        break
      case 'lowest':
        sortObj = { rating: 1, createdAt: -1 }
        break
      case 'helpful':
        sortObj = { helpfulCount: -1, createdAt: -1 }
        break
      default: // 'recent'
        sortObj = { createdAt: -1 }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Review.countDocuments(query)
    const reviews = await Review.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .select('-email -helpfulVoters -__v')
      .populate('customerId', 'name avatar profileImage')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerId: r.customerId ? r.customerId._id : null,
      customerName: r.customerName,
      location: r.location,
      avatarUrl: r.avatarUrl || (r.customerId ? r.customerId.avatar || r.customerId.profileImage || '' : ''),
      title: r.title,
      review: r.review,
      rating: r.rating,
      images: r.images || [],
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount || 0,
      createdAt: r.createdAt,
    }))

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: formatted.length,
      reviews: formatted,
    })
  } catch (error) {
    console.error('Get Product Reviews Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product reviews.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get rating summary for a specific product
// @route   GET /api/products/:productId/review-summary
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductReviewSummary = async (req, res) => {
  try {
    const { productId } = req.params

    const approvedReviews = await Review.find({ productId, status: 'approved' }).select('rating')

    const totalCount = approvedReviews.length

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          averageRating: 0,
          totalCount: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      })
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let sum = 0
    for (const r of approvedReviews) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
      sum += r.rating
    }

    const averageRating = Number((sum / totalCount).toFixed(1))

    res.status(200).json({
      success: true,
      summary: {
        averageRating,
        totalCount,
        distribution,
      },
    })
  } catch (error) {
    console.error('Get Product Review Summary Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review summary.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark a review as helpful (once per user)
// @route   POST /api/reviews/:id/helpful
// @access  Private (Authenticated)
// ─────────────────────────────────────────────────────────────────────────────
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review || review.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const userId = req.user._id.toString()
    const alreadyVoted = review.helpfulVoters.some((v) => v.toString() === userId)

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful.',
        helpfulCount: review.helpfulCount,
      })
    }

    review.helpfulVoters.push(req.user._id)
    review.helpfulCount = (review.helpfulCount || 0) + 1
    await review.save()

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback!',
      helpfulCount: review.helpfulCount,
    })
  } catch (error) {
    console.error('Mark Helpful Error:', error)
    res.status(500).json({ success: false, message: 'Failed to record helpful vote.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all public approved reviews (for store testimonials page)
// @route   GET /api/reviews
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .select('-email -helpfulVoters -__v')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerName: r.customerName,
      location: r.location,
      title: r.title,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      images: r.images || [],
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount || 0,
      createdAt: r.createdAt,
    }))

    res.status(200).json({
      success: true,
      count: formatted.length,
      reviews: formatted,
    })
  } catch (error) {
    console.error('Get Public Reviews Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get approved & featured testimonials (for Homepage)
// @route   GET /api/reviews/featured
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getFeaturedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved', isFeatured: true })
      .sort({ createdAt: -1 })
      .select('-email -helpfulVoters -__v')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerName: r.customerName,
      location: r.location,
      title: r.title,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      images: r.images || [],
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount || 0,
      createdAt: r.createdAt,
    }))

    res.status(200).json({
      success: true,
      count: formatted.length,
      reviews: formatted,
    })
  } catch (error) {
    console.error('Get Featured Reviews Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured reviews.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).select('-email -helpfulVoters')
    if (!review || review.status !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      })
    }
    res.status(200).json({
      success: true,
      review: {
        id: review._id,
        customerName: review.customerName,
        location: review.location,
        title: review.title,
        review: review.review,
        rating: review.rating,
        avatarUrl: review.avatarUrl,
        images: review.images || [],
        helpfulCount: review.helpfulCount || 0,
        createdAt: review.createdAt,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews with filters for Admin (includes images & product name)
// @route   GET /api/reviews/admin/all
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { status, rating, search } = req.query
    const query = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (rating && rating !== 'all') {
      query.rating = Number(rating)
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [{ customerName: regex }, { review: regex }, { title: regex }, { location: regex }, { email: regex }]
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('productId', 'name slug images')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerId: r.customerId,
      customerName: r.customerName,
      location: r.location,
      email: r.email,
      title: r.title,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      images: r.images || [],
      status: r.status,
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount || 0,
      productId: r.productId ? r.productId._id : null,
      productName: r.productId ? r.productId.name : null,
      productSlug: r.productId ? r.productId.slug : null,
      productImage: r.productId && r.productId.images ? getProductImageUrl(r.productId.images) || null : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: formatted.length,
      reviews: formatted,
    })
  } catch (error) {
    console.error('Admin Get Reviews Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin reviews.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get review statistics for Admin Dashboard
// @route   GET /api/reviews/admin/stats
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getReviewStatsAdmin = async (req, res) => {
  try {
    const total = await Review.countDocuments()
    const pending = await Review.countDocuments({ status: 'pending' })
    const approved = await Review.countDocuments({ status: 'approved' })
    const rejected = await Review.countDocuments({ status: 'rejected' })
    const featuredCount = await Review.countDocuments({ status: 'approved', isFeatured: true })

    const avgResult = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ])

    const averageRating =
      avgResult.length > 0 && avgResult[0].avgRating
        ? Number(avgResult[0].avgRating.toFixed(1))
        : 5.0

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        averageRating,
        featuredCount,
      },
    })
  } catch (error) {
    console.error('Review Stats Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics.',
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Approve review
// @route   PATCH /api/reviews/:id/approve
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    review.status = 'approved'
    await review.save()

    res.status(200).json({
      success: true,
      message: 'Review approved successfully.',
      review,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve review.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reject review
// @route   PATCH /api/reviews/:id/reject
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    review.status = 'rejected'
    review.isFeatured = false
    await review.save()

    res.status(200).json({
      success: true,
      message: 'Review rejected.',
      review,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject review.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle or set isFeatured on review
// @route   PATCH /api/reviews/:id/featured
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleFeaturedReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const { isFeatured } = req.body
    review.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !review.isFeatured

    if (review.isFeatured && review.status !== 'approved') {
      review.status = 'approved'
    }

    await review.save()

    res.status(200).json({
      success: true,
      message: review.isFeatured ? 'Review marked as featured.' : 'Review removed from featured.',
      review,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle featured status.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update review (Admin)
// @route   PATCH /api/reviews/:id
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.updateReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const { customerName, location, title, review: reviewText, rating, status, isFeatured } = req.body

    if (customerName) review.customerName = customerName
    if (location) review.location = location
    if (title !== undefined) review.title = title
    if (reviewText !== undefined) review.review = reviewText
    if (rating && Number.isInteger(Number(rating)) && rating >= 1 && rating <= 5) {
      review.rating = Number(rating)
    }
    if (['pending', 'approved', 'rejected'].includes(status)) {
      review.status = status
    }
    if (typeof isFeatured === 'boolean') {
      review.isFeatured = isFeatured
    }

    await review.save()

    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review.' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete review (also cleans Cloudinary images if needed)
// @route   DELETE /api/reviews/:id
// @access  Private / Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review.' })
  }
}
