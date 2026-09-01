/**
 * Extract a single product-image URL from a product's `images` field.
 *
 * The `images` field can be:
 *   - [{ url, publicId, order, isPrimary }]  (new object format)
 *   - ['url1', 'url2']                        (legacy string array)
 *   - ''                                      (empty / missing)
 *   - single string                           (edge case)
 *
 * Returns the primary image URL (the one flagged isPrimary, else the first).
 */
const getProductImageUrl = (images, legacyImage) => {
  let raw = []

  if (Array.isArray(images)) {
    raw = images
  } else if (typeof images === 'string' && images) {
    raw = [images]
  }

  if (raw.length === 0 && legacyImage) {
    return legacyImage
  }

  if (raw.length === 0) {
    return ''
  }

  if (typeof raw[0] === 'string') {
    return raw[0]
  }

  const first = raw.find((img) => Boolean(img && img.isPrimary)) || raw[0]
  if (first && typeof first === 'object') {
    return first.url || ''
  }

  return ''
}

module.exports = {
  getProductImageUrl,
}