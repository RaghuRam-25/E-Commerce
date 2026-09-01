import React, { useEffect, useCallback } from 'react'

interface ReviewPhotoLightboxProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export const ReviewPhotoLightbox: React.FC<ReviewPhotoLightboxProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-semibold bg-black/40 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all z-10"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Main image */}
      <div
        className="relative max-w-4xl max-h-[80vh] w-full mx-8 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Review photo ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {/* Navigation buttons */}
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

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 flex gap-2 px-4 overflow-x-auto max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
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
