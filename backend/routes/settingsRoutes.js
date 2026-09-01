const express = require('express')
const {
  getShippingCodSettings,
  updateShippingCodSettings,
} = require('../controllers/settingsController')
const { protect } = require('../middleware/authMiddleware')
const { authorize } = require('../middleware/roleMiddleware')

const router = express.Router()

// Public settings (checkout reads COD config from here)
router.get('/shipping-cod', getShippingCodSettings)

// Admin settings update
router.patch(
  '/shipping-cod',
  protect,
  authorize('admin', 'super_admin'),
  updateShippingCodSettings
)

module.exports = router
