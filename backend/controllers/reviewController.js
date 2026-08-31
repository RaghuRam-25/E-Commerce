const Review = require('../models/Review')

// @desc    Submit a customer review
// @route   POST /api/reviews
// @access  Private (Authenticated Customers)
exports.createReview = async (req, res) => {
  try {
    const { review, rating, location, productId, orderId } = req.body

    // 1. Validation Checks
    if (!review || typeof review !== 'string' || review.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be at least 10 characters long.',
      })
    }

    if (review.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot exceed 500 characters.',
      })
    }

    const numRating = Number(rating)
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      })
    }

    // 2. Prevent duplicate submission spam (e.g. check if same user posted in last 1 minute)
    if (req.user && req.user._id) {
      const recent = await Review.findOne({
        customerId: req.user._id,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      })
      if (recent) {
        return res.status(429).json({
          success: false,
          message: 'Please wait a moment before submitting another review.',
        })
      }
    }

    // 3. Extract customer info strictly from req.user (Never trust client body for identity)
    const newReview = await Review.create({
      customerId: req.user ? req.user._id : undefined,
      customerName: req.user ? req.user.name : 'Valued Customer',
      email: req.user ? req.user.email : undefined,
      avatarUrl: req.user ? req.user.avatarUrl || '' : '',
      location: location && location.trim() ? location.trim() : 'Dhaka, Bangladesh',
      review: review.trim(),
      rating: numRating,
      status: 'pending', // Always pending by default
      isFeatured: false, // Always false by default
      productId: productId || undefined,
      orderId: orderId || undefined,
    })

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted and is pending administrator approval.',
      review: {
        id: newReview._id,
        customerName: newReview.customerName,
        location: newReview.location,
        review: newReview.review,
        rating: newReview.rating,
        status: newReview.status,
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

// @desc    Get all approved public reviews
// @route   GET /api/reviews
// @access  Public
exports.getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .select('-email -__v')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerName: r.customerName,
      location: r.location,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
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

// @desc    Get approved & featured testimonials (for Homepage)
// @route   GET /api/reviews/featured
// @access  Public
exports.getFeaturedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved', isFeatured: true })
      .sort({ createdAt: -1 })
      .select('-email -__v')

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerName: r.customerName,
      location: r.location,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
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

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).select('-email')
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
        review: review.review,
        rating: review.rating,
        avatarUrl: review.avatarUrl,
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

// @desc    Get all reviews with filters for Admin
// @route   GET /api/reviews/admin/all
// @access  Private / Admin
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
      query.$or = [{ customerName: regex }, { review: regex }, { location: regex }, { email: regex }]
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 })

    const formatted = reviews.map((r) => ({
      id: r._id,
      customerId: r.customerId,
      customerName: r.customerName,
      location: r.location,
      email: r.email,
      review: r.review,
      rating: r.rating,
      avatarUrl: r.avatarUrl,
      status: r.status,
      isFeatured: r.isFeatured,
      isVerifiedPurchase: r.isVerifiedPurchase,
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

// @desc    Get review statistics for Admin Dashboard
// @route   GET /api/reviews/admin/stats
// @access  Private / Admin
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

    const averageRating = avgResult.length > 0 && avgResult[0].avgRating
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

// @desc    Approve review
// @route   PATCH /api/reviews/:id/approve
// @access  Private / Admin
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

// @desc    Reject review
// @route   PATCH /api/reviews/:id/reject
// @access  Private / Admin
exports.rejectReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    review.status = 'rejected'
    review.isFeatured = false // Auto un-feature if rejected
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

// @desc    Toggle or set isFeatured on review
// @route   PATCH /api/reviews/:id/featured
// @access  Private / Admin
exports.toggleFeaturedReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const { isFeatured } = req.body
    review.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !review.isFeatured

    // Ensure only approved reviews can be featured
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

// @desc    Update review (Admin)
// @route   PATCH /api/reviews/:id
// @access  Private / Admin
exports.updateReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const { customerName, location, review: reviewText, rating, status, isFeatured } = req.body

    if (customerName) review.customerName = customerName
    if (location) review.location = location
    if (reviewText) review.review = reviewText
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

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private / Admin
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
