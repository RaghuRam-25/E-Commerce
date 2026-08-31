const Order = require('../models/Order')
const User = require('../models/User')
const Product = require('../models/Product')
const Review = require('../models/Review')
const Subscriber = require('../models/Subscriber')

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard/stats
// @access  Admin, Super Admin
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      approvedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      rejectedOrders,
      totalCustomers,
      totalProducts,
      totalReviews,
      totalSubscribers,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'approved' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Review.countDocuments(),
      Subscriber.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(8).select('-activity').lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
      ]),
    ])

    const totalRevenue = revenueResult[0]?.totalRevenue || 0

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        approvedOrders,
        processingOrders,
        shippedOrders,
        completedOrders: deliveredOrders,
        cancelledOrders,
        rejectedOrders,
        totalCustomers,
        totalProducts,
        totalReviews,
        totalSubscribers,
        totalRevenue,
      },
      recentOrders,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats.' })
  }
}

module.exports = {
  getDashboardStats,
}
