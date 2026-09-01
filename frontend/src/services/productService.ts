import { apiClient } from './apiClient'
import type { Product, ProductImage } from '@/types'

export interface ProductPayload {
  name: string
  slug?: string
  description: string
  category: string
  price: number
  discount: number
  stock: number
  sku: string
  images?: ProductImage[]
  rating?: number
  isFeatured?: boolean
  isActive?: boolean
}

interface BackendProductImage {
  url?: string
  publicId?: string
  public_id?: string
  order?: number
  isPrimary?: boolean
}

type BackendProduct = Record<string, unknown> & {
  _id?: string
  id?: string
  images?: unknown
  primaryImage?: string
}

export interface ProductListResponse {
  success: boolean
  total: number
  count: number
  products: BackendProduct[]
}

export interface ProductResponse {
  success: boolean
  message?: string
  product: BackendProduct
}

// Map backend object (id/_id, images as objects) into frontend Product type
const mapProduct = (p: BackendProduct): Product => {
  const rawImages = Array.isArray(p.images) ? (p.images as unknown[]) : []
  return {
    ...(p as unknown as Product),
    id: (p.id as string) || (p._id as string),
    images: rawImages.map((img) =>
      typeof img === 'string'
        ? { url: img, publicId: '', order: 0, isPrimary: false }
        : {
            url: (img as BackendProductImage).url || '',
            publicId: (img as BackendProductImage).publicId || (img as BackendProductImage).public_id || '',
            order: (img as BackendProductImage).order ?? 0,
            isPrimary: Boolean((img as BackendProductImage).isPrimary),
          }
    ),
    primaryImage: (p.primaryImage as string) || '',
  }
}

export const getAdminProducts = async (): Promise<Product[]> => {
  const res = await apiClient.get<ProductListResponse>('/products/admin/all')
  return (res.products || []).map(mapProduct)
}

export const createProduct = async (payload: ProductPayload): Promise<Product> => {
  const res = await apiClient.post<ProductResponse>('/products', payload)
  return mapProduct(res.product)
}

export const updateProduct = async (
  id: string,
  payload: Partial<ProductPayload>
): Promise<Product> => {
  const res = await apiClient.put<ProductResponse>(`/products/${id}`, payload)
  return mapProduct(res.product)
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  const res = await apiClient.delete(`/products/${id}`)
  return res.success
}

export const deleteProductImage = async (
  productId: string,
  image: ProductImage
): Promise<Product> => {
  const res = await apiClient.delete<ProductResponse>(
    `/products/${productId}/images/${image.publicId || image.url}`,
    // Send url/publicId in body for robust matching on the backend
    { body: JSON.stringify({ publicId: image.publicId, url: image.url }) }
  )
  return mapProduct(res.product)
}

export const reorderProductImagesApi = async (
  productId: string,
  images: ProductImage[]
): Promise<Product> => {
  const res = await apiClient.patch<ProductResponse>(`/products/${productId}/images/reorder`, {
    order: images,
  })
  return mapProduct(res.product)
}

export const setPrimaryProductImageApi = async (
  productId: string,
  image: ProductImage
): Promise<Product> => {
  const res = await apiClient.patch<ProductResponse>(
    `/products/${productId}/images/${image.publicId || image.url}/primary`,
    { url: image.url }
  )
  return mapProduct(res.product)
}