const Subscriber = require('../models/Subscriber')

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.',
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      })
    }

    let subscriber = await Subscriber.findOne({ email: cleanEmail })

    if (subscriber) {
      if (subscriber.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed.',
        })
      } else {
        // Reactivate unsubscribed user
        subscriber.status = 'active'
        subscriber.subscribedAt = new Date()
        await subscriber.save()
        return res.status(200).json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          subscriber: {
            id: subscriber._id,
            email: subscriber.email,
            status: subscriber.status,
            subscribedAt: subscriber.subscribedAt,
            updatedAt: subscriber.updatedAt,
          },
        })
      }
    }

    // Create new subscriber
    subscriber = await Subscriber.create({
      email: cleanEmail,
      status: 'active',
    })

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed',
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
        status: subscriber.status,
        subscribedAt: subscriber.subscribedAt,
        updatedAt: subscriber.updatedAt,
      },
    })
  } catch (error) {
    console.error('Subscription Error:', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
    })
  }
}

// @desc    Get all subscribers with search and status filter
// @route   GET /api/subscribers
// @access  Private / Admin
exports.getAllSubscribers = async (req, res) => {
  try {
    const { search, status } = req.query
    const query = {}

    if (search) {
      query.email = { $regex: search.trim(), $options: 'i' }
    }

    if (status && status !== 'all') {
      query.status = status
    }

    const subscribers = await Subscriber.find(query).sort({ createdAt: -1 })
    
    const formatted = subscribers.map((s) => ({
      id: s._id,
      email: s.email,
      status: s.status,
      subscribedAt: s.subscribedAt,
      updatedAt: s.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: formatted.length,
      subscribers: formatted,
    })
  } catch (error) {
    console.error('Get Subscribers Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscribers.',
    })
  }
}

// @desc    Update subscriber status (activate / deactivate)
// @route   PATCH /api/subscribers/:id
// @access  Private / Admin
exports.updateSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['active', 'unsubscribed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.',
      })
    }

    const subscriber = await Subscriber.findById(id)
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.',
      })
    }

    subscriber.status = status
    await subscriber.save()

    res.status(200).json({
      success: true,
      message: `Subscriber status updated to ${status}.`,
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
        status: subscriber.status,
        subscribedAt: subscriber.subscribedAt,
        updatedAt: subscriber.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update Subscriber Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update subscriber.',
    })
  }
}

// @desc    Delete subscriber
// @route   DELETE /api/subscribers/:id
// @access  Private / Admin
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params
    const subscriber = await Subscriber.findByIdAndDelete(id)

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully.',
    })
  } catch (error) {
    console.error('Delete Subscriber Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscriber.',
    })
  }
}

// @desc    Get subscriber stats
// @route   GET /api/subscribers/stats
// @access  Private / Admin
exports.getSubscriberStats = async (req, res) => {
  try {
    const total = await Subscriber.countDocuments()
    const active = await Subscriber.countDocuments({ status: 'active' })
    const unsubscribed = await Subscriber.countDocuments({ status: 'unsubscribed' })
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const newThisWeek = await Subscriber.countDocuments({ createdAt: { $gte: sevenDaysAgo } })

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        unsubscribed,
        newThisWeek,
      },
    })
  } catch (error) {
    console.error('Subscriber Stats Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriber stats.',
    })
  }
}
