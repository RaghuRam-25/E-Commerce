const SocialLink = require('../models/SocialLink')

// @desc    Get all active social links (public)
// @route   GET /api/social
// @access  Public
const getSocialLinks = async (req, res) => {
  try {
    const links = await SocialLink.find({ isActive: true }).sort({ order: 1 })
    res.status(200).json({ success: true, count: links.length, links })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Get all social links including inactive (admin)
// @route   GET /api/social/all
// @access  Admin, Super Admin
const getAllSocialLinksAdmin = async (req, res) => {
  try {
    const links = await SocialLink.find().sort({ order: 1 })
    res.status(200).json({ success: true, count: links.length, links })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Add social link
// @route   POST /api/social
// @access  Admin, Super Admin
const createSocialLink = async (req, res) => {
  try {
    const link = await SocialLink.create(req.body)
    res.status(201).json({ success: true, link })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' })
  }
}

// @desc    Update social link
// @route   PUT /api/social/:id
// @access  Admin, Super Admin
const updateSocialLink = async (req, res) => {
  try {
    const link = await SocialLink.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!link) {
      return res.status(404).json({ success: false, message: 'Social link not found.' })
    }
    res.status(200).json({ success: true, link })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// @desc    Delete social link
// @route   DELETE /api/social/:id
// @access  Admin, Super Admin
const deleteSocialLink = async (req, res) => {
  try {
    const link = await SocialLink.findByIdAndDelete(req.params.id)
    if (!link) {
      return res.status(404).json({ success: false, message: 'Social link not found.' })
    }
    res.status(200).json({ success: true, message: 'Social link deleted.' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getSocialLinks, getAllSocialLinksAdmin, createSocialLink, updateSocialLink, deleteSocialLink }
