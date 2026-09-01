const Order = require('../models/Order')
const Product = require('../models/Product')

const { STATUS_TRANSITIONS, ORDER_STATUSES } = Order

const VALID_TRANSITIONS = STATUS_TRANSITIONS
const VALID_STATUSES = ORDER_STATUSES

// Shared order shape sent to the admin UI
const formatOrder = (o) => ({
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
  deliveryCharge: o.deliveryCharge,
  codCharge: o.codCharge || 0,
  total: o.total,
  paymentMethod: o.paymentMethod,
  paymentMethodName: o.paymentMethodName,
  paymentStatus: o.paymentStatus,
  payment: o.payment || {
    method: o.paymentMethod || 'cod',
    status: o.paymentStatus || 'unpaid',
    paidAmount: o.paymentStatus === 'paid' ? o.total : 0,
    remainingAmount: o.paymentStatus === 'paid' ? 0 : o.total,
    transactionId: o.trxId || o.paymentId || '',
    paidAt: null,
  },
  paymentId: o.paymentId,
  trxId: o.trxId,
  status: o.status,
  statusHistory: o.statusHistory || [],
  notes: o.notes,
  orderDate: o.orderDate,
  approvedBy: o.approvedBy,
  approvedAt: o.approvedAt,
  rejectionReason: o.rejectionReason,
  rejectedBy: o.rejectedBy,
  rejectedAt: o.rejectedAt,
  activity: o.activity || [],
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
})

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

    const formatted = orders.map((o) => formatOrder(o))

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
      order: formatOrder(order),
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
    order.statusHistory.push({
      status: 'approved',
      changedBy: req.user._id,
      changedByRole: req.user.role,
      changedByName: req.user.name,
      changedAt: new Date(),
      note: 'Order approved by admin',
    })
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
      order: formatOrder(order),
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
    order.statusHistory.push({
      status: 'rejected',
      changedBy: req.user._id,
      changedByRole: req.user.role,
      changedByName: req.user.name,
      changedAt: new Date(),
      note: reason.trim(),
    })
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
      order: formatOrder(order),
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
    const prevStatus = order.statusHistory.length
      ? order.statusHistory[order.statusHistory.length - 1].status
      : order.status
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedByRole: req.user.role,
      changedByName: req.user.name,
      changedAt: new Date(),
      note: 'Status updated by admin',
    })
    order.activity.push({
      action: `Status changed to ${status}`,
      by: req.user._id,
      byName: req.user.name,
      timestamp: new Date(),
    })

    // When an order is delivered, a COD order's remaining cash is collected.
    if (status === 'delivered' && order.payment && order.payment.method === 'cod') {
      order.payment.status = 'paid'
      order.payment.paidAmount = order.total
      order.payment.remainingAmount = 0
      order.payment.paidAt = new Date()
      order.paymentStatus = 'paid'
    }

    if (status === 'cancelled' || status === 'rejected') {
      // Return stock when an order is cancelled/rejected.
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          })
        }
      }
    }

    await order.save()

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order: formatOrder(order),
    })
  } catch (error) {
    console.error('Admin Update Order Status Error:', error)
    res.status(500).json({ success: false, message: 'Failed to update order status.' })
  }
}

// @desc    Mark a COD order as paid (courier collected the cash)
// @route   PATCH /api/admin/orders/:id/payment
// @access  Admin, Super Admin
const adminMarkOrderPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (order.payment?.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already marked as paid.' })
    }

    order.payment.method = order.payment?.method || order.paymentMethod || 'cod'
    order.payment.status = 'paid'
    order.payment.paidAmount = order.total
    order.payment.remainingAmount = 0
    order.payment.paidAt = new Date()
    order.paymentStatus = 'paid'

    order.activity.push({
      action: 'Payment collected (paid)',
      by: req.user._id,
      byName: req.user.name,
      note: 'Full payment collected by courier/admin.',
      timestamp: new Date(),
    })

    await order.save()

    res.status(200).json({
      success: true,
      message: 'Order marked as paid.',
      order: formatOrder(order),
    })
  } catch (error) {
    console.error('Admin Mark Order Paid Error:', error)
    res.status(500).json({ success: false, message: 'Failed to mark order as paid.' })
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
        outForDelivery: statusMap.out_for_delivery || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
        rejected: statusMap.rejected || 0,
        returned: statusMap.returned || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        paymentBreakdown: {
          unpaid: paymentMap.unpaid || 0,
          partially_paid: paymentMap.partially_paid || 0,
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
  adminMarkOrderPaid,
  adminGetOrderStats,
}
