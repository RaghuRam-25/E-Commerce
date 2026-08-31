const Address = require('../models/Address')

// ── GET /api/addresses ──────────────────────────────────────────
// Returns all saved addresses for the authenticated user
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    })
  } catch (err) {
    console.error('getAddresses error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch addresses.' })
  }
}

// ── POST /api/addresses ─────────────────────────────────────────
// Creates a new saved address for the authenticated user
const createAddress = async (req, res) => {
  try {
    const { label, fullName, phone, addressLine, city, district, postalCode, country, isDefault } = req.body

    if (!fullName || !phone || !addressLine || !city || !district) {
      return res.status(400).json({
        success: false,
        message: 'fullName, phone, addressLine, city, and district are required.',
      })
    }

    // Enforce max 10 saved addresses per user
    const existingCount = await Address.countDocuments({ userId: req.user._id })
    if (existingCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'You can save a maximum of 10 addresses.',
      })
    }

    const address = await Address.create({
      userId: req.user._id,
      label: label || 'Home',
      fullName,
      phone,
      addressLine,
      city,
      district,
      postalCode: postalCode || '',
      country: country || 'Bangladesh',
      isDefault: isDefault || existingCount === 0, // Auto-default if first address
    })

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address,
    })
  } catch (err) {
    console.error('createAddress error:', err)
    res.status(500).json({ success: false, message: 'Failed to save address.' })
  }
}

// ── PATCH /api/addresses/:id ────────────────────────────────────
// Updates an existing address — ownership enforced
const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user._id })

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied.' })
    }

    const { label, fullName, phone, addressLine, city, district, postalCode, country, isDefault } = req.body

    if (label !== undefined) address.label = label
    if (fullName !== undefined) address.fullName = fullName
    if (phone !== undefined) address.phone = phone
    if (addressLine !== undefined) address.addressLine = addressLine
    if (city !== undefined) address.city = city
    if (district !== undefined) address.district = district
    if (postalCode !== undefined) address.postalCode = postalCode
    if (country !== undefined) address.country = country
    if (isDefault !== undefined) address.isDefault = isDefault

    await address.save()

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      address,
    })
  } catch (err) {
    console.error('updateAddress error:', err)
    res.status(500).json({ success: false, message: 'Failed to update address.' })
  }
}

// ── DELETE /api/addresses/:id ───────────────────────────────────
// Deletes an address — ownership enforced
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id })

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied.' })
    }

    // If deleted address was default, set the most recent remaining as default
    if (address.isDefault) {
      const next = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
      if (next) {
        next.isDefault = true
        await next.save()
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    })
  } catch (err) {
    console.error('deleteAddress error:', err)
    res.status(500).json({ success: false, message: 'Failed to delete address.' })
  }
}

// ── PATCH /api/addresses/:id/default ───────────────────────────
// Sets an address as default — ownership enforced
const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user._id })

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied.' })
    }

    // Clear all defaults for this user first
    await Address.updateMany({ userId: req.user._id }, { $set: { isDefault: false } })

    address.isDefault = true
    await address.save({ validateBeforeSave: false }) // Skip pre-save to avoid double update

    res.status(200).json({
      success: true,
      message: 'Default address updated.',
      address,
    })
  } catch (err) {
    console.error('setDefaultAddress error:', err)
    res.status(500).json({ success: false, message: 'Failed to set default address.' })
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
}
