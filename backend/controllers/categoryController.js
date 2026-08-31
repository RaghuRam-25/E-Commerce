const Category = require('../models/Category')

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 })
    res.status(200).json({ success: true, count: categories.length, categories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching categories.' })
  }
}

// @desc    Create category
// @route   POST /api/categories
// @access  Admin, Super Admin
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body)
    res.status(201).json({ success: true, category })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category with this name or slug already exists.' })
    }
    res.status(500).json({ success: false, message: error.message || 'Server error.' })
  }
}

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin, Super Admin
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' })
    }

    res.status(200).json({ success: true, category })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating category.' })
  }
}

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin, Super Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' })
    }
    res.status(200).json({ success: true, message: 'Category deleted.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory }
