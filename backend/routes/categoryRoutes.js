const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController')

// Public
router.get('/', getCategories)

// Admin
router.post('/', protect, authorize('admin', 'super_admin'), createCategory)
router.put('/:id', protect, authorize('admin', 'super_admin'), updateCategory)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteCategory)

module.exports = router
