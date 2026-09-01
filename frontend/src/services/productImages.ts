import type { ProductImage } from '@/types'

type RawImage = string | Partial<ProductImage>

/**
 * Normalize a product's image data into a consistent ProductImage[] array.
 *
 * Accepts:
 *   - images: ProductImage[]   (new object format)
 *   - images: string[]         (legacy string array)
 *   - single `image` string    (legacy field)
 */
export const normalizeProductImages = (
  images: RawImage[] | undefined | null,
  legacyImage?: string
): ProductImage[] => {
  let raw: RawImage[] = []
  if (Array.isArray(images)) {
    raw = images
  } else if (typeof images === 'string' && images) {
    raw = [images]
  }

  const entries: ProductImage[] = raw.map((img, index) => {
    if (img && typeof img === 'object') {
      return {
        url: img.url || '',
        publicId: img.publicId || '',
        order: typeof img.order === 'number' ? img.order : index,
        isPrimary: Boolean(img.isPrimary),
      }
    }
    return {
      url: String(img || ''),
      publicId: '',
      order: index,
      isPrimary: false,
    }
  })

  if (entries.length === 0 && legacyImage) {
    entries.push({ url: legacyImage, publicId: '', order: 0, isPrimary: true })
  }

  entries.sort((a, b) => a.order - b.order)

  const normalized = entries.map((img, index) => ({
    url: img.url,
    publicId: img.publicId || '',
    order: index,
    isPrimary: index === 0 ? true : Boolean(img.isPrimary),
  }))

  if (normalized.some((img) => img.isPrimary)) {
    return normalized
  }
  if (normalized.length > 0) {
    normalized[0] = { ...normalized[0], isPrimary: true }
  }
  return normalized
}

/**
 * Get the primary product image URL (explicit primary, else first image).
 */
export const getPrimaryImage = (
  images: RawImage[] | undefined | null,
  legacyImage?: string
): string => {
  const normalized = normalizeProductImages(images, legacyImage)
  const primary = normalized.find((img) => img.isPrimary) || normalized[0]
  return primary?.url || ''
}

/**
 * Convenience accessor for a Product object.
 */
export const getProductPrimaryImage = (product: {
  images?: RawImage[] | null
  primaryImage?: string
}): string => {
  return product.primaryImage || getPrimaryImage(product.images)
}
