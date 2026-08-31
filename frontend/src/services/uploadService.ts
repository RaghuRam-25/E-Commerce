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

/**
 * Delete image from Cloudinary by public_id
 */
export const deleteImage = async (public_id: string): Promise<boolean> => {
  const res = await apiClient.post('/upload/delete', { public_id })
  return res.success
}
