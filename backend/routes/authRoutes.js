const express = require('express')
const { body } = require('express-validator')
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
]

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
]

// Routes
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.get('/me', protect, getMe)
router.post('/logout', logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router
