const { cloudinary } = require('../config/cloudinary')

/**
 * @desc    Upload single image to Cloudinary
 * @route   POST /api/upload/single
 * @access  Private / Admin (or public depending on route setup)
 */
const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach an image file to upload.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary.',
      data: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload image.',
      error: error.message,
    })
  }
}

/**
 * @desc    Upload multiple images to Cloudinary
 * @route   POST /api/upload/multiple
 * @access  Private / Admin
 */
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please attach at least one image file to upload.',
      })
    }

    const images = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }))

    res.status(200).json({
      success: true,
      message: `${images.length} image(s) uploaded successfully to Cloudinary.`,
      data: images,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload images.',
      error: error.message,
    })
  }
}

/**
 * @desc    Delete image from Cloudinary by public_id
 * @route   POST /api/upload/delete (or DELETE /api/upload/delete)
 * @access  Private / Admin
 */
const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required to delete an image.',
      })
    }

    const result = await cloudinary.uploader.destroy(public_id)

    if (result.result === 'ok' || result.result === 'not me') {
      return res.status(200).json({
        success: true,
        message: 'Image deleted from Cloudinary successfully.',
        result,
      })
    }

    res.status(400).json({
      success: false,
      message: 'Cloudinary could not delete the image.',
      result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image from Cloudinary.',
      error: error.message,
    })
  }
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
}
