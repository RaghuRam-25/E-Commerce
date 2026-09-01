const mongoose = require('mongoose')
const Product = require('../models/Product')
const { cloudinary } = require('../config/cloudinary')

// Helper function to find product by ObjectId, slug, or SKU safely
const findProductByIdOrSlug = async (idParam) => {
  if (!idParam) return null
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const prod = await Product.findById(idParam)
    if (prod) return prod
  }
  return await Product.findOne({
    $or: [{ slug: idParam }, { sku: idParam }],
  })
}

// Normalize images array for storage (accepts strings or objects)
const normalizeImagesInput = (images) => {
  if (!Array.isArray(images)) return []
  return images.map((img, index) => {
    if (img && typeof img === 'object') {
      return {
        url: img.url || '',
        publicId: img.publicId || img.public_id || '',
        order: typeof img.order === 'number' ? img.order : index,
        isPrimary: Boolean(img.isPrimary),
      }
    }
    return { url: img || '', publicId: '', order: index, isPrimary: false }
  })
}

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

// @desc    Get single product by ID, slug, or SKU
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }
    res.status(200).json({ success: true, product })
  } catch (error) {
    console.error('Get product by ID error:', error)
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Get related products (same category, excluding current product)
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(200).json({ success: true, count: 0, products: [] })
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      category: { $regex: product.category, $options: 'i' },
      isActive: true,
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(8)

    res.status(200).json({
      success: true,
      count: related.length,
      products: related,
    })
  } catch (error) {
    console.error('Get related products error:', error)
    res.status(500).json({ success: false, message: 'Server error fetching related products.' })
  }
}

// @desc    Create new product
// @route   POST /api/products
// @access  Admin, Super Admin
const createProduct = async (req, res) => {
  try {
    const body = { ...req.body }
    if (Array.isArray(body.images)) {
      body.images = normalizeImagesInput(body.images)
    }
    const product = await Product.create(body)
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
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const body = { ...req.body }
    // Merge images so adding new images never wipes out existing ones
    // unless the client explicitly sends the full new `images` array.
    if (Array.isArray(body.images)) {
      body.images = normalizeImagesInput(body.images)
    }
    if (body.addImages && Array.isArray(body.addImages)) {
      const current = normalizeImagesInput(product.images)
      const added = normalizeImagesInput(body.addImages)
      const merged = [...current, ...added].map((img, idx) => ({
        ...img,
        order: idx,
        isPrimary: idx === 0,
      }))
      body.images = merged
      delete body.addImages
    }

    Object.keys(body).forEach((key) => {
      if (key !== 'images') {
        product[key] = body[key]
      }
    })
    if (body.images) {
      product.images = body.images
    }

    const saved = await product.save()

    res.status(200).json({ success: true, product: saved })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error updating product.' })
  }
}

// @desc    Delete product (hard delete)
// @route   DELETE /api/products/:id
// @access  Admin, Super Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    await Product.findByIdAndDelete(product._id)

    res.status(200).json({ success: true, message: 'Product deleted successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting product.' })
  }
}

// @desc    Get all products including inactive (admin view)
// @route   GET /api/products/admin/all
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

// @desc    Delete a single image from a product (and from Cloudinary)
// @route   DELETE /api/products/:id/images/:imageId  (or by publicId in body)
// @access  Admin, Super Admin
const deleteProductImage = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const images = Array.isArray(product.images) ? product.images : []
    const imageId = req.params.imageId
    const publicIdParam = req.body?.publicId || req.body?.public_id

    let target = null

    if (imageId && imageId !== 'undefined') {
      // Match by the image object's _id when available
      target = images.find((img) => String(img._id || img.id || '') === String(imageId))
    }
    // Fall back to matching by url or publicId
    if (!target) {
      target = images.find(
        (img) =>
          (publicIdParam && String(img.publicId) === String(publicIdParam)) ||
          (req.body?.url && String(img.url) === String(req.body.url))
      )
    }

    if (!target) {
      return res.status(404).json({ success: false, message: 'Image not found on product.' })
    }

    const remaining = images.filter((img) => img !== target)

    // Delete from Cloudinary if it has a public_id
    if (target.publicId) {
      try {
        await cloudinary.uploader.destroy(target.publicId)
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr.message)
      }
    }

    // Rebuild order / primary
    const normalized = remaining.map((img, idx) => ({
      url: typeof img === 'string' ? img : img.url,
      publicId: typeof img === 'string' ? '' : img.publicId || '',
      order: idx,
      isPrimary: idx === 0,
    }))

    product.images = normalized
    product.image = normalized[0]?.url || ''
    await product.save()

    res.status(200).json({ success: true, message: 'Image deleted successfully.', product })
  } catch (error) {
    console.error('Delete product image error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error deleting image.' })
  }
}

// @desc    Reorder product images
// @route   PATCH /api/products/:id/images/reorder
// @access  Admin, Super Admin
const reorderProductImages = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const { order } = req.body
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ success: false, message: 'A non-empty order array is required.' })
    }

    const current = Array.isArray(product.images) ? product.images : []
    const byId = new Map()
    const byUrl = new Map()
    current.forEach((img) => {
      const id = String(img._id || img.id || '')
      byId.set(id, img)
      byUrl.set(img.url, img)
    })

    const reordered = []
    for (const item of order) {
      const id = typeof item === 'string' ? item : item?.id || item?._id
      let found = byId.get(String(id || ''))
      if (!found && typeof item === 'object' && item.url) {
        found = byUrl.get(item.url)
      }
      if (found) reordered.push(found)
    }

    if (reordered.length === 0) {
      return res.status(400).json({ success: false, message: 'No matching images found to reorder.' })
    }

    const normalized = reordered.map((img, idx) => ({
      url: typeof img === 'string' ? img : img.url,
      publicId: typeof img === 'string' ? '' : img.publicId || '',
      order: idx,
      isPrimary: idx === 0,
    }))

    product.images = normalized
    product.image = normalized[0]?.url || ''
    await product.save()

    res.status(200).json({ success: true, message: 'Product image order updated.', product })
  } catch (error) {
    console.error('Reorder product images error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error reordering images.' })
  }
}

// @desc    Set the primary image for a product
// @route   PATCH /api/products/:id/images/:imageId/primary
// @access  Admin, Super Admin
const setPrimaryProductImage = async (req, res) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    const imageId = req.params.imageId
    const images = Array.isArray(product.images) ? product.images : []

    const target = images.find(
      (img) => String(img._id || img.id || img.url || '') === String(imageId) || img.url === imageId
    )

    if (!target) {
      return res.status(404).json({ success: false, message: 'Image not found on product.' })
    }

    // Reorder so the target becomes first
    const withoutTarget = images.filter((img) => img !== target)
    const reordered = [target, ...withoutTarget]
    const normalized = reordered.map((img, idx) => ({
      url: typeof img === 'string' ? img : img.url,
      publicId: typeof img === 'string' ? '' : img.publicId || '',
      order: idx,
      isPrimary: idx === 0,
    }))

    product.images = normalized
    product.image = normalized[0]?.url || ''
    await product.save()

    res.status(200).json({ success: true, message: 'Primary image set successfully.', product })
  } catch (error) {
    console.error('Set primary image error:', error)
    res.status(500).json({ success: false, message: error.message || 'Server error setting primary image.' })
  }
}

module.exports = {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  deleteProductImage,
  reorderProductImages,
  setPrimaryProductImage,
}
