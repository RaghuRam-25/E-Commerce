const mongoose = require('mongoose')

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Platform URL is required'],
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    iconName: {
      type: String,
      enum: ['facebook', 'instagram', 'linkedin', 'youtube', 'twitter', 'tiktok', 'whatsapp'],
      required: [true, 'Icon name is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('SocialLink', socialLinkSchema)
