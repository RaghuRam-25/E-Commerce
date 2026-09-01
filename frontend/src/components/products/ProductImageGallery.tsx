import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { ProductImage } from '@/types'
import { normalizeProductImages } from '@/services/productImages'

interface ProductImageGalleryProps {
  images: (ProductImage | string)[] | undefined | null
  legacyImage?: string
  productName?: string
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  legacyImage,
  productName = 'Product',
}) => {
  const galleryImages = normalizeProductImages(images, legacyImage)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % galleryImages.length)
  }, [galleryImages.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 40) {
      if (diff < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (galleryImages.length === 0) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center text-gray-300 text-6xl">
        🛍️
      </div>
    )
  }

  const activeImage = galleryImages[activeIndex]

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div
        className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative group select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={activeImage.url}
          alt={`${productName} - Image ${activeIndex + 1}`}
          onClick={() => {
            setLightboxIndex(activeIndex)
            setLightbox(true)
          }}
          className={`w-full h-full object-cover cursor-zoom-in transition-transform duration-500 ${
            zoom ? 'scale-150 cursor-zoom-out' : 'group-hover:scale-105'
          }`}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          draggable={false}
        />

        {/* Image counter */}
        {galleryImages.length > 1 && (
          <span className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {galleryImages.length}
          </span>
        )}

        {/* Zoom hint */}
        <span className="absolute bottom-4 left-4 bg-black/40 text-white/80 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Hover to zoom · Click to fullscreen
        </span>
      </div>

      {/* Prev / Next buttons */}
      {galleryImages.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 text-gray-600 font-semibold text-xs py-2 rounded-xl transition-colors"
            aria-label="Previous image"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => {
              setLightboxIndex(activeIndex)
              setLightbox(true)
            }}
            className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 text-gray-600 font-semibold text-xs py-2 rounded-xl transition-colors"
            aria-label="Open fullscreen"
          >
            ⛶ Fullscreen
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 text-gray-600 font-semibold text-xs py-2 rounded-xl transition-colors"
            aria-label="Next image"
          >
            Next →
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-[72px] h-[72px] min-w-[72px] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                idx === activeIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                  : 'border-gray-100 hover:border-gray-300'
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <ProductLightbox
          images={galleryImages.map((img) => img.url)}
          initialIndex={lightboxIndex}
          productName={productName}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  )
}

interface ProductLightboxProps {
  images: string[]
  initialIndex: number
  productName: string
  onClose: () => void
}

const ProductLightbox: React.FC<ProductLightboxProps> = ({
  images,
  initialIndex,
  productName,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 40) {
      if (diff < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold bg-black/40 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all z-10"
        aria-label="Close fullscreen"
      >
        ✕
      </button>

      {/* Main image */}
      <div className="relative max-w-5xl max-h-[80vh] w-full mx-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 shadow-lg"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 shadow-lg"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2 px-4 overflow-x-auto max-w-full" onClick={(e) => e.stopPropagation()}>
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                idx === currentIndex
                  ? 'border-emerald-400 opacity-100 scale-110'
                  : 'border-white/20 opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageGallery
