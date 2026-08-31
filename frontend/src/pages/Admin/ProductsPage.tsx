import React, { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Product } from '@/types'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/services/mockData'
import { uploadSingleImage } from '@/services/uploadService'

const emptyForm: Omit<Product, 'id'> = {
  name: '',
  slug: '',
  description: '',
  category: 'Clothing & Fashion',
  price: 1000,
  discount: 0,
  stock: 10,
  sku: 'SKU-NEW',
  images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
  rating: 4.5,
  isFeatured: false,
  isActive: true,
  createdAt: new Date().toISOString().split('T')[0],
}

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [showFormModal, setShowFormModal] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(emptyForm)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setUploadError(null)
    setShowFormModal(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id)
    setUploadError(null)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      stock: product.stock,
      sku: product.sku,
      images: product.images,
      rating: product.rating,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      createdAt: product.createdAt,
    })
    setShowFormModal(true)
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setUploadError(null)

    try {
      const result = await uploadSingleImage(file)
      if (result?.url) {
        setFormData((prev) => ({
          ...prev,
          images: [result.url, ...prev.images.slice(1)],
        }))
      }
    } catch (err: any) {
      console.error('Image upload failed:', err)
      setUploadError(err.message || 'Image upload failed. Ensure backend & Cloudinary credentials are set.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p))
      )
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      }
      setProducts((prev) => [newProduct, ...prev])
    }
    setShowFormModal(false)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeleteTargetId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Add, edit, or delete store products & upload to Cloudinary</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
          + Add New Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                    <div>
                      <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-medium text-gray-700">{product.category}</td>
                <td className="p-3 font-bold text-emerald-600">৳{product.price.toLocaleString()}</td>
                <td className="p-3">
                  {product.discount > 0 ? (
                    <span className="text-rose-600 font-bold">-{product.discount}%</span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="p-3 font-semibold text-gray-900">{product.stock} units</td>
                <td className="p-3">
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Draft'}
                  </Badge>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="text-xs text-emerald-600 hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(product.id)}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">Confirm Product Deletion</h3>
            <p className="text-xs text-gray-500">Are you sure you want to permanently remove this product from the database?</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(deleteTargetId)} className="flex-1">
                Delete Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Product Details' : 'Add New Store Product'}</h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <Input
                label="Product Title *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category *"
                  value={formData.category}
                  options={INITIAL_CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                />

                <Input
                  label="SKU Code *"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Price (৳) *"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />

                <Input
                  label="Discount %"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                />

                <Input
                  label="Stock *"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Cloudinary Image File Upload + Direct URL */}
              <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                <label className="block text-xs font-bold text-gray-800">Product Image (Upload or URL)</label>
                
                <div className="flex items-center gap-3">
                  {formData.images[0] && (
                    <img src={formData.images[0]} alt="Preview" className="w-14 h-14 rounded-lg object-cover border shadow-sm flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {uploadingImage && (
                      <p className="text-[11px] text-emerald-600 font-semibold animate-pulse">⏳ Uploading to Cloudinary...</p>
                    )}
                    {uploadError && (
                      <p className="text-[11px] text-rose-600 font-semibold">{uploadError}</p>
                    )}
                  </div>
                </div>

                <Input
                  label="Direct Image URL"
                  value={formData.images[0] || ''}
                  onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                  placeholder="https://res.cloudinary.com/..."
                  required
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Featured Product
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Active Status
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFormModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={uploadingImage} className="flex-1 font-bold">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProductsPage