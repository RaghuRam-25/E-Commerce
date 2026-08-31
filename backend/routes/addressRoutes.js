const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController')

// All routes require authentication
router.use(protect)

// GET    /api/addresses        — list all addresses for current user
router.get('/', getAddresses)

// POST   /api/addresses        — create a new address
router.post('/', createAddress)

// PATCH  /api/addresses/:id    — update address fields
router.patch('/:id', updateAddress)

// DELETE /api/addresses/:id    — delete an address
router.delete('/:id', deleteAddress)

// PATCH  /api/addresses/:id/default — set address as default
router.patch('/:id/default', setDefaultAddress)

module.exports = router
