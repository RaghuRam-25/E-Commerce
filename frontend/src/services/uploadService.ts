import { apiClient } from './apiClient'

export interface UploadResult {
  url: string
  public_id: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data: UploadResult
}

export interface MultipleUploadResponse {
  success: boolean
  message: string
  data: UploadResult[]
}

/**
 * Upload single image file to Cloudinary backend endpoint
 */
export const uploadSingleImage = async (file: File): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('image', file)

  const res = await apiClient.post<UploadResponse>('/upload/single', formData)
  return res.data
}

/**
 * Upload multiple image files to Cloudinary backend endpoint
 */
export const uploadMultipleImages = async (files: File[]): Promise<UploadResult[]> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))

  const res = await apiClient.post<MultipleUploadResponse>('/upload/multiple', formData)
  return res.data
}

export interface UploadProgressInfo {
  loaded: number
  total: number
}

/**
 * Upload a single image file with granular progress reporting.
 * Uses XMLHttpRequest so we can surface upload progress events per file.
 */
export const uploadSingleImageWithProgress = (
  file: File,
  onProgress?: (progress: UploadProgressInfo) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('bd_commerce_token')
    const formData = new FormData()
    formData.append('image', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload/single`)

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total })
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.success && data.data) {
          resolve(data.data)
        } else {
          reject(new Error(data?.message || 'Upload failed.'))
        }
      } catch {
        reject(new Error('Invalid server response.'))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload.'))
    xhr.ontimeout = () => reject(new Error('Upload timed out.'))

    xhr.send(formData)
  })
}

/**
 * Delete image from Cloudinary by public_id
 */
export const deleteImage = async (public_id: string): Promise<boolean> => {
  const res = await apiClient.post('/upload/delete', { public_id })
  return res.success
}
