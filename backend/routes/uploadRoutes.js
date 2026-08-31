const express = require('express')
const router = express.Router()
const upload = require('../middleware/uploadMiddleware')
const { protect } = require('../middleware/authMiddleware')
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/uploadController')

// POST /api/upload/single — Upload 1 image (field name: 'image')
router.post('/single', protect, upload.single('image'), uploadSingleImage)

// POST /api/upload/multiple — Upload up to 10 images (field name: 'images')
router.post('/multiple', protect, upload.array('images', 10), uploadMultipleImages)

// POST /api/upload/delete — Delete image by public_id
router.post('/delete', protect, deleteImage)

module.exports = router
