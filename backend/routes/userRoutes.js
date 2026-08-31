const express = require('express')
const {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  getAllUsers,
  createUser,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

const router = express.Router()

// Profile routes (Any authenticated user)
router.get('/me', protect, getMyProfile)
router.get('/profile', protect, getMyProfile)
router.put('/me', protect, updateMyProfile)
router.patch('/me', protect, updateMyProfile)
router.patch('/profile', protect, updateMyProfile)
router.put('/me/password', protect, changeMyPassword)

// Admin user directory
router.get('/', protect, authorize('admin', 'super_admin'), getAllUsers)
router.get('/:id', protect, authorize('admin', 'super_admin'), getUserById)

// Super Admin user management
router.post('/', protect, authorize('super_admin'), createUser)
router.put('/:id/role', protect, authorize('super_admin'), updateUserRole)
router.patch('/:id/role', protect, authorize('super_admin'), updateUserRole)
router.put('/:id/status', protect, authorize('admin', 'super_admin'), toggleUserStatus)
router.patch('/:id/status', protect, authorize('admin', 'super_admin'), toggleUserStatus)
router.delete('/:id', protect, authorize('super_admin'), deleteUser)

module.exports = router
