const Settings = require('../models/Settings')

// @desc    Get shipping & COD settings (public-safe payload)
// @route   GET /api/settings/shipping-cod, GET /api/admin/settings/shipping-cod
// @access  Public (no secrets here)
const getShippingCodSettings = async (req, res) => {
  try {
    const config = await Settings.getShippingConfig()
    res.status(200).json({
      success: true,
      settings: {
        codEnabled: config.codEnabled,
        codCharge: config.codCharge,
        minimumCodCharge: config.minimumCodCharge,
        requireUpfrontCodCharge: config.requireUpfrontCodCharge,
        shippingCharge: config.shippingCharge,
      },
    })
  } catch (error) {
    console.error('Get shipping settings error:', error)
    res.status(500).json({ success: false, message: 'Server error fetching shipping settings.' })
  }
}

// @desc    Update shipping & COD settings
// @route   PATCH /api/admin/settings/shipping-cod
// @access  Admin, Super Admin
const updateShippingCodSettings = async (req, res) => {
  const {
    codEnabled,
    codCharge,
    minimumCodCharge,
    requireUpfrontCodCharge,
    shippingCharge,
  } = req.body

  try {
    const doc = await Settings.getShippingConfig()

    if (typeof codEnabled === 'boolean') doc.codEnabled = codEnabled
    if (codCharge !== undefined) doc.codCharge = Math.max(0, Number(codCharge) || 0)
    if (minimumCodCharge !== undefined) doc.minimumCodCharge = Math.max(0, Number(minimumCodCharge) || 0)
    if (typeof requireUpfrontCodCharge === 'boolean') doc.requireUpfrontCodCharge = requireUpfrontCodCharge
    if (shippingCharge !== undefined) doc.shippingCharge = Math.max(0, Number(shippingCharge) || 0)

    await doc.save()

    res.status(200).json({
      success: true,
      message: 'Shipping & COD settings updated.',
      settings: {
        codEnabled: doc.codEnabled,
        codCharge: doc.codCharge,
        minimumCodCharge: doc.minimumCodCharge,
        requireUpfrontCodCharge: doc.requireUpfrontCodCharge,
        shippingCharge: doc.shippingCharge,
      },
    })
  } catch (error) {
    console.error('Update shipping settings error:', error)
    res.status(500).json({ success: false, message: 'Server error updating shipping settings.' })
  }
}

module.exports = {
  getShippingCodSettings,
  updateShippingCodSettings,
}
