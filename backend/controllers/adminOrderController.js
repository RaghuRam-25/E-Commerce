const Order = require('../models/Order')

const VALID_TRANSITIONS = {
  pending: ['approved', 'cancelled', 'rejected'],
  confirmed: ['processing', 'cancelled'],
  approved: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  rejected: [],
  returned: [],
}

const VALID_STATUSES = ['pending', 'confirmed', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected', 'returned']

const adminGetOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20, sort = 'newest' } = req.query
    const query = {}

    if (status && status !== 'all') query.status = status
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus

    if (search && search.trim()) {
      const q = search.trim()
      query.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } },
      ]
    }

    const sortOrder = sort === 'oldest' ? 1 : -1
    const skip = (Number(page) - 1) * Number(limit)
    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .select('-activity')
      .lean()

    const formatted = orders.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      items: o.items,
      subtotal: o.subtotal,
      discount: o.discount,
      deliveryFee: o.deliveryFee || o.deliveryCharge,
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentMethodName: o.paymentMethodName,
      paymentStatus: o.paymentStatus,
      paymentId: o.paymentId,
      trxId: o.trxId,
      status: o.status,
      notes: o.notes,
      orderDate: o.orderDate,
      approvedBy: o.approvedBy,
      approvedAt: o.approvedAt,
      rejectionReason: o.rejectionReason,
      rejectedBy: o.rejectedBy,
      rejectedAt: o.rejectedAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }))

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: formatted.length,
      orders: formatted,
    })
  } catch (error) {
    console.error('Admin Get Orders Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' })
  }
}

const adminGetOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean()
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    res.status(200).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee || order.deliveryCharge,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentMethodName: order.paymentMethodName,
        paymentStatus: order.paymentStatus,
        paymentId: order.paymentId,
        trxId: order.trxId,
        status: order.status,
        notes: order.notes,
        orderDate: order.orderDate,
        approvedBy: order.approvedBy,
        approvedAt: order.approvedAt,
        rejectionReason: order.rejectionReason,
        rejectedBy: order.rejectedBy,
        rejectedAt: order.rejectedAt,
        activity: order.activity || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('Admin Get Order Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' })
  }
}

const adminApproveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve an order with status '${order.status}'. Only pending orders can be approved.`,
      })
    }

    order.status = 'approved'
    order.approvedBy = req.user._id
    order.approvedAt = new Date()
    order.activity.push({
      action: 'Order approved',
      by: req.user._id,
      byName: req.user.name,
      timestamp: new Date(),
    })

    await order.save()

    res.status(200).json({
      success: true,
      message: 'Order approved successfully.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        approvedBy: order.approvedBy,
        approvedAt: order.approvedAt,
      },
    })
  } catch (error) {
    console.error('Admin Approve Order Error:', error)
    res.status(500).json({ success: false, message: 'Failed to approve order.' })
  }
}

const adminRejectOrder = async (req, res) => {
  try {
    const { reason } = req.body
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (!['pending', 'approved'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject an order with status '${order.status}'.`,
      })
    }

    order.status = 'rejected'
    order.rejectionReason = reason.trim()
    order.rejectedBy = req.user._id
    order.rejectedAt = new Date()
    order.activity.push({
      action: 'Order rejected',
      by: req.user._id,
      byName: req.user.name,
      note: reason.trim(),
      timestamp: new Date(),
    })

    await order.save()

    res.status(200).json({
      success: true,
      message: 'Order rejected.',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        rejectionReason: order.rejectionReason,
        rejectedBy: order.rejectedBy,
        rejectedAt: order.rejectedAt,
      },
    })
  } catch (error) {
    console.error('Admin Reject Order Error:', error)
    res.status(500).json({ success: false, message: 'Failed to reject order.' })
  }
}

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    const allowed = VALID_TRANSITIONS[order.status]
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from '${order.status}' to '${status}'. Allowed transitions: ${allowed?.join(', ') || 'none'}.`,
      })
    }

    order.status = status
    order.activity.push({
      action: `Status changed to ${status}`,
      by: req.user._id,
      byName: req.user.name,
      timestamp: new Date(),
    })

    await order.save()

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Admin Update Order Status Error:', error)
    res.status(500).json({ success: false, message: 'Failed to update order status.' })
  }
}

const adminGetOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])

    const paymentStats = await Order.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
        },
      },
    ])

    const statusMap = {}
    stats.forEach((s) => { statusMap[s._id] = s.count })

    const paymentMap = {}
    paymentStats.forEach((s) => { paymentMap[s._id] = s.count })

    const totalOrders = await Order.countDocuments()
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    res.status(200).json({
      success: true,
      stats: {
        total: totalOrders,
        pending: statusMap.pending || 0,
        approved: statusMap.approved || 0,
        confirmed: statusMap.confirmed || 0,
        processing: statusMap.processing || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
        rejected: statusMap.rejected || 0,
        returned: statusMap.returned || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        paymentBreakdown: {
          unpaid: paymentMap.unpaid || 0,
          pending: paymentMap.pending || 0,
          processing: paymentMap.processing || 0,
          paid: paymentMap.paid || 0,
          failed: paymentMap.failed || 0,
          cancelled: paymentMap.cancelled || 0,
          refunded: paymentMap.refunded || 0,
        },
      },
    })
  } catch (error) {
    console.error('Admin Order Stats Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch order stats.' })
  }
}

module.exports = {
  adminGetOrders,
  adminGetOrderById,
  adminApproveOrder,
  adminRejectOrder,
  adminUpdateOrderStatus,
  adminGetOrderStats,
}
