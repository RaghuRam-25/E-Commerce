const Product = require('../models/Product')

// @desc    Get all active products (with search, filter, sort, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      featured,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query

    const filter = { isActive: true }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    if (category) filter.category = { $regex: category, $options: 'i' }
    if (featured === 'true') filter.isFeatured = true
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    const sortOrder = order === 'asc' ? 1 : -1
    const sortObj = { [sortBy]: sortOrder }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter).sort(sortObj).skip(skip).limit(Number(limit))

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: products.length,
      products,
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ success: false, message: 'Server error fetching products.' })
  }
}

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }
    res.status(200).json({ success: true, product })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Create new product
// @route   POST /api/products
// @access  Admin, Super Admin
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json({ success: true, product })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Product with this SKU or slug already exists.' })
    }
    res.status(500).json({ success: false, message: error.message || 'Server error creating product.' })
  }
}

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin, Super Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    res.status(200).json({ success: true, product })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating product.' })
  }
}

// @desc    Delete product (soft delete — set isActive: false)
// @route   DELETE /api/products/:id
// @access  Admin, Super Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    await Product.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: 'Product deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting product.' })
  }
}

// @desc    Get all products including inactive (admin view)
// @route   GET /api/products/admin
// @access  Admin, Super Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query

    const filter = {}
    if (search) filter.name = { $regex: search, $options: 'i' }
    if (category) filter.category = { $regex: category, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))

    res.status(200).json({ success: true, total, count: products.length, products })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getAllProductsAdmin }
