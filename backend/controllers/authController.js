const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const User = require('../models/User')

// Helper: generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || user.profileImage || '',
      profileImage: user.profileImage || user.avatar || '',
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  })
}

// @desc    Register new customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0]?.msg })
  }

  const { name, fullName, email, phone, password } = req.body
  const finalName = (fullName || name || '').trim()

  if (!finalName) {
    return res.status(400).json({ success: false, message: 'Full name is required.' })
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      })
    }

    // Always assign role 'customer' for public registration
    const user = await User.create({
      name: finalName,
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      password,
      role: 'customer',
      status: 'active',
    })

    sendTokenResponse(user, 201, res)
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: 'Server error during registration.' })
  }
}

// @desc    Login user (all roles use same endpoint)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0]?.msg })
  }

  const { email, password } = req.body

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      })
    }

    sendTokenResponse(user, 200, res)
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error during login.' })
  }
}

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || user.profileImage || '',
        profileImage: user.profileImage || user.avatar || '',
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  })
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email: email?.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      })
    }

    const resetToken = crypto.randomBytes(4).toString('hex').toUpperCase()
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: 'Password reset code generated successfully.',
      resetToken,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ success: false, message: 'Server error. Please try again.' })
  }
}

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email and new password are required.',
    })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    })
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.',
      })
    }

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ success: false, message: 'Server error. Please try again.' })
  }
}

module.exports = { register, login, getMe, logout, forgotPassword, resetPassword }
