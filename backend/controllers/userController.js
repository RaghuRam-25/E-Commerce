const User = require('../models/User')

// @desc    Get current logged-in user profile
// @route   GET /api/users/me, GET /api/profile
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.' })
  }
}

// @desc    Update current user profile (name, phone, avatar/profileImage)
// @route   PUT /api/users/me, PATCH /api/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  const { name, fullName, phone, avatar, profileImage } = req.body
  const updateData = {}

  if (name || fullName) updateData.name = (fullName || name).trim()
  if (phone !== undefined) updateData.phone = phone.trim()
  if (avatar !== undefined) updateData.avatar = avatar
  if (profileImage !== undefined) updateData.profileImage = profileImage

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )
    res.status(200).json({ success: true, message: 'Profile updated successfully.', user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile.' })
  }
}

// @desc    Change current user's password
// @route   PUT /api/users/me/password
// @access  Private
const changeMyPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' })
  }

  try {
    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({ success: true, message: 'Password updated successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error changing password.' })
  }
}

// @desc    Get all users (directory)
// @route   GET /api/users, GET /api/admin/users
// @access  Admin, Super Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query

    const filter = {}
    if (role) filter.role = role
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const users = await User.find(filter).sort({ createdAt: -1 })
    res.status(200).json({ success: true, count: users.length, users })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users.' })
  }
}

// @desc    Create new user / admin (Super Admin only)
// @route   POST /api/users, POST /api/admin/users
// @access  Super Admin
const createUser = async (req, res) => {
  const { name, fullName, email, phone, password, role = 'admin', status = 'active' } = req.body
  const finalName = (fullName || name || '').trim()

  if (!finalName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' })
    }

    const user = await User.create({
      name: finalName,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      password,
      role,
      status,
    })

    res.status(201).json({
      success: true,
      message: `${role === 'admin' ? 'Admin' : 'User'} created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating user.' })
  }
}

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin, Super Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    res.status(200).json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Update user role (promote/demote)
// @route   PUT /api/users/:id/role, PATCH /api/admin/users/:id/role
// @access  Super Admin ONLY
const updateUserRole = async (req, res) => {
  const { role } = req.body

  if (!['customer', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified.' })
  }

  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (targetUser.role === 'super_admin' && req.user._id.toString() !== targetUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin role cannot be modified by another user.',
      })
    }

    targetUser.role = role
    await targetUser.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: `User role updated to '${role}' successfully.`,
      user: targetUser,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user role.' })
  }
}

// @desc    Toggle user active/inactive status
// @route   PUT /api/users/:id/status, PATCH /api/admin/users/:id/status
// @access  Admin, Super Admin
const toggleUserStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super Admin account status cannot be changed.',
      })
    }

    targetUser.status = targetUser.status === 'active' ? 'inactive' : 'active'
    await targetUser.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: `User account ${targetUser.status === 'active' ? 'activated' : 'deactivated'} successfully.`,
      user: targetUser,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user status.' })
  }
}

// @desc    Delete user (Super Admin only)
// @route   DELETE /api/users/:id, DELETE /api/admin/users/:id
// @access  Super Admin
const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super Admin account cannot be deleted.' })
    }

    await User.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'User deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting user.' })
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getAllUsers,
  createUser,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
}
