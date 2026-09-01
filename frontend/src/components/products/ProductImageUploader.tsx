import React, { useState, useRef, useCallback } from 'react'
import { uploadSingleImageWithProgress } from '@/services/uploadService'
import type { ProductImage } from '@/types'

interface ProductImageUploaderProps {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

interface UploadStatus {
  url: string
  fileName: string
  state: 'uploading' | 'success' | 'error'
  progress: number
  publicId?: string
  errorMessage?: string
}

const isImageFile = (file: File): { ok: boolean; message?: string } => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return { ok: false, message: 'Only JPG, JPEG, PNG and WEBP images are supported.' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: `${file.name} exceeds the 5MB size limit.` }
  }
  return { ok: true }
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
}) => {
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reorderTarget, setReorderTarget] = useState<number | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files)
      if (fileList.length === 0) return

      setIsUploading(true)

      const submitted: UploadStatus[] = []
      const uploadPromises: Promise<void>[] = []

      fileList.forEach((file, idx) => {
        const status: UploadStatus = {
          url: URL.createObjectURL(file),
          fileName: file.name,
          state: 'uploading',
          progress: 0,
        }
        submitted.push(status)

        uploadPromises.push(
          (async () => {
            const validation = isImageFile(file)
            if (!validation.ok) {
              submitted[idx].state = 'error'
              submitted[idx].errorMessage = validation.message
              return
            }

            try {
              const result = await uploadSingleImageWithProgress(file, (p) => {
                submitted[idx].progress =
                  p.total > 0 ? Math.round((p.loaded / p.total) * 100) : 0
              })
              submitted[idx].state = 'success'
              submitted[idx].progress = 100
              submitted[idx].url = result.url
              submitted[idx].publicId = result.public_id
            } catch (err) {
              const msg = err instanceof Error ? err.message : `${file.name} could not be uploaded.`
              submitted[idx].state = 'error'
              submitted[idx].errorMessage = msg
            }
          })()
        )
      })

      setUploadStatuses(submitted)

      await Promise.all(uploadPromises)

      // Collect only successfully uploaded images
      const uploaded = submitted.filter((s) => s.state === 'success' && s.url)
      if (uploaded.length > 0) {
        const validUploads: ProductImage[] = uploaded.map((u, idx) => ({
          url: u.url,
          publicId: u.publicId || '',
          order: idx + 1,
          isPrimary: false,
        }))
        const hasImages = images.length > 0
        let nextImages = [...images, ...validUploads]
        if (!hasImages) {
          nextImages = nextImages.map((img, idx) => ({
            ...img,
            order: idx,
            isPrimary: idx === 0,
          }))
        } else {
          nextImages = nextImages.map((img, idx) => ({ ...img, order: idx }))
        }
        onChange(nextImages)
      }

      setIsUploading(false)
      setUploadStatuses([])
    },
    [images, onChange]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const removeImage = (url: string) => {
    onChange(images.filter((img) => img.url !== url))
  }

  const moveImage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return
    const reordered = [...images]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    onChange(reordered.map((img, idx) => ({ ...img, order: idx, isPrimary: idx === 0 })))
  }

  const setPrimary = (url: string) => {
    onChange(
      images.map((img, idx) => ({
        ...img,
        order: img.url === url ? 0 : idx,
        isPrimary: img.url === url,
      }))
    )
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-800">
        Product Images (Upload multiple · JPG/PNG/WEBP · up to 5MB each)
      </label>

      {/* Dropzone / File picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-emerald-400 bg-gray-50/50'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
          ↑
        </div>
        <p className="text-sm font-semibold text-gray-700">Click or drag & drop images here</p>
        <p className="text-[11px] text-gray-400">Select multiple images or drop a batch</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Active uploads (progress) */}
      {uploadStatuses.length > 0 && (
        <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-white">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {isUploading ? 'Uploading...' : 'Upload complete'}
          </p>
          {uploadStatuses.map((status, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <img src={status.url} alt="" className="w-9 h-9 rounded-md object-cover border flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium truncate">{status.fileName}</span>
                  <span className="font-bold text-gray-500 ml-2">
                    {status.state === 'success'
                      ? '✓'
                      : status.state === 'error'
                      ? '✕'
                      : `${status.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status.state === 'error'
                        ? 'bg-rose-500'
                        : status.state === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${status.state === 'success' ? 100 : status.progress}%` }}
                  />
                </div>
                {status.state === 'error' && status.errorMessage && (
                  <p className="text-[11px] text-rose-600 mt-0.5">❌ {status.errorMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image grid with preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div
              key={img.url + idx}
              draggable
              onDragStart={() => setReorderTarget(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (reorderTarget !== null) {
                  moveImage(reorderTarget, idx)
                  setReorderTarget(null)
                }
              }}
              className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm cursor-move"
            >
              <img src={img.url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />

              {/* Primary label */}
              {img.isPrimary && (
                <span className="absolute top-1 left-1 bg-amber-400 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                  ★ Primary
                </span>
              )}

              {/* Order number */}
              <span className="absolute top-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {idx + 1}
              </span>

              {/* Remove button */}
              <button
                onClick={() => removeImage(img.url)}
                className="absolute top-1 -right-0 bg-rose-500 text-white rounded-l-md px-1.5 py-0.5 text-xs opacity-90 hover:bg-rose-600 shadow"
                aria-label="Remove image"
                title="Remove image"
              >
                ×
              </button>

              {/* Actions on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.isPrimary && (
                  <button
                    onClick={() => setPrimary(img.url)}
                    className="text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md py-0.5"
                  >
                    Set Primary
                  </button>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => moveImage(idx, idx - 1)}
                    className="flex-1 text-[9px] font-bold text-white bg-black/50 hover:bg-black/70 rounded-md py-0.5"
                    aria-label="Move left"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => moveImage(idx, idx + 1)}
                    className="flex-1 text-[9px] font-bold text-white bg-black/50 hover:bg-black/70 rounded-md py-0.5"
                    aria-label="Move right"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageUploader