const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')
const {
  getSocialLinks,
  getAllSocialLinksAdmin,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} = require('../controllers/socialController')

// Public: active social links only
router.get('/', getSocialLinks)

// Admin: all social links (incl. inactive)
router.get('/all', protect, authorize('admin', 'super_admin'), getAllSocialLinksAdmin)

// Admin: CRUD
router.post('/', protect, authorize('admin', 'super_admin'), createSocialLink)
router.put('/:id', protect, authorize('admin', 'super_admin'), updateSocialLink)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteSocialLink)

module.exports = router
