const Order = require('../models/Order')
const Product = require('../models/Product')
const PaymentMethod = require('../models/PaymentMethod')

// @desc    Place new order
// @route   POST /api/orders
// @access  Public or Authenticated
const placeOrder = async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    address,
    city,
    district,
    postalCode,
    country,
    items,
    paymentMethod,
    paymentStatus,
    trxId,
    paymentId,
    notes,
    deliveryCharge = 60,
    deliveryFee = 60,
    discount = 0,
  } = req.body

  // 1. Validate Items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' })
  }

  // 2. Validate Payment Method Selection (Requirement 20)
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Please select a payment method.',
    })
  }

  try {
    const methodDoc = await PaymentMethod.findOne({ id: paymentMethod.toLowerCase() })
    if (methodDoc && !methodDoc.enabled) {
      return res.status(400).json({
        success: false,
        message: `The payment method '${methodDoc.name}' is currently unavailable. Please choose another option.`,
      })
    }

    // 3. Process items and calculate total
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      let product = null
      if (item.productId) {
        try {
          product = await Product.findById(item.productId)
        } catch {}
      }

      const itemPrice = item.price || (product ? product.price : 0)
      const itemQty = Number(item.quantity) || 1
      subtotal += itemPrice * itemQty

      orderItems.push({
        productId: product ? product._id : undefined,
        productName: item.productName || item.name || product?.name || 'Product',
        productImage: item.productImage || item.image || product?.images?.[0] || '',
        price: itemPrice,
        quantity: itemQty,
      })

      // If product exists in DB and has stock, decrement
      if (product && product.stock >= itemQty) {
        product.stock -= itemQty
        await product.save()
      }
    }

    const finalDeliveryCharge = Number(deliveryFee || deliveryCharge || 60)
    const finalDiscount = Number(discount || 0)
    const total = subtotal + finalDeliveryCharge - finalDiscount

    // 4. Create immutable Address Snapshot (Requirement 12)
    const finalAddressSnapshot = {
      fullName: shippingAddress?.fullName || customerName || req.user?.name || '',
      phone: shippingAddress?.phone || customerPhone || req.user?.phone || '',
      addressLine: shippingAddress?.addressLine || address || '',
      city: shippingAddress?.city || city || 'Dhaka',
      district: shippingAddress?.district || district || 'Dhaka',
      postalCode: shippingAddress?.postalCode || postalCode || '',
      country: shippingAddress?.country || country || 'Bangladesh',
    }

    // 5. Determine payment status
    let initialPaymentStatus = 'unpaid'
    if (paymentMethod.toLowerCase() === 'cod') {
      initialPaymentStatus = 'unpaid'
    } else if (trxId || paymentStatus === 'paid') {
      initialPaymentStatus = 'paid'
    } else if (paymentStatus) {
      initialPaymentStatus = paymentStatus
    }

    const order = await Order.create({
      user: req.user ? req.user._id : undefined,
      customerName: customerName || req.user?.name || finalAddressSnapshot.fullName || 'Customer',
      customerEmail: customerEmail || req.user?.email || 'customer@example.com',
      customerPhone: customerPhone || req.user?.phone || finalAddressSnapshot.phone || '',
      shippingAddress: finalAddressSnapshot,
      address: finalAddressSnapshot.addressLine,
      city: finalAddressSnapshot.city,
      postalCode: finalAddressSnapshot.postalCode,
      items: orderItems,
      subtotal,
      deliveryCharge: finalDeliveryCharge,
      deliveryFee: finalDeliveryCharge,
      discount: finalDiscount,
      total,
      paymentMethod: paymentMethod.toLowerCase(),
      paymentMethodName: methodDoc?.name || paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentId: paymentId || '',
      trxId: trxId || '',
      status: 'pending',
      notes: notes || '',
      activity: [
        {
          action: 'Order placed',
          by: req.user?._id,
          byName: req.user?.name || 'Customer',
          note: `Payment method: ${methodDoc?.name || paymentMethod}`,
          timestamp: new Date(),
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order,
    })
  } catch (error) {
    console.error('Place order error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error placing order.' })
  }
}

// @desc    Get user's orders (or all orders for admin)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role)
    const { status, paymentStatus, search, page = 1, limit = 50 } = req.query

    const filter = {}
    if (!isAdmin) {
      filter.user = req.user._id
    }

    if (status) filter.status = status
    if (paymentStatus) filter.paymentStatus = paymentStatus
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Order.countDocuments(filter)
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email phone')

    res.status(200).json({ success: true, total, count: orders.length, orders })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching orders.' })
  }
}

// @desc    Get current user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: orders.length, orders })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching orders.' })
  }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or Admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (
      order.user?._id?.toString() !== req.user._id.toString() &&
      !['admin', 'super_admin'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' })
    }

    res.status(200).json({ success: true, order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Update order status
// @route   PATCH /api/orders/:id/status, PATCH /api/admin/orders/:id/status
// @access  Admin, Super Admin
const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus } = req.body

  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' })
    }

    if (status) order.status = status
    if (paymentStatus) order.paymentStatus = paymentStatus

    await order.save()

    res.status(200).json({ success: true, message: 'Order status updated.', order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating order status.' })
  }
}

module.exports = {
  placeOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
}
