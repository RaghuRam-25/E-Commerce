const multer = require('multer')
const { storage } = require('../config/cloudinary')

// Multer upload middleware configured with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only image files are allowed!'), false)
    }
  },
})

module.exports = upload
