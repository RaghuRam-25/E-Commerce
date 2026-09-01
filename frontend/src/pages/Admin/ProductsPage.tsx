import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ProductImageUploader } from '@/components/products/ProductImageUploader'
import type { Product, ProductImage } from '@/types'
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/productService'
import { normalizeProductImages } from '@/services/productImages'
import { INITIAL_CATEGORIES } from '@/services/mockData'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  category: 'Clothing & Fashion',
  price: 1000,
  discount: 0,
  stock: 10,
  sku: 'SKU-NEW',
  isFeatured: false,
  isActive: true,
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState(emptyForm.category)
  const [formPrice, setFormPrice] = useState(1000)
  const [formDiscount, setFormDiscount] = useState(0)
  const [formStock, setFormStock] = useState(10)
  const [formSku, setFormSku] = useState('SKU-NEW')
  const [formImages, setFormImages] = useState<ProductImage[]>([])
  const [formIsFeatured, setFormIsFeatured] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const items = await getAdminProducts()
      setProducts(items)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load products.'))
    } finally {
      setLoadingProducts(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setFormCategory(emptyForm.category)
    setFormPrice(emptyForm.price)
    setFormDiscount(emptyForm.discount)
    setFormStock(emptyForm.stock)
    setFormSku('SKU-NEW')
    setFormImages([])
    setFormIsFeatured(false)
    setFormIsActive(true)
  }

  const handleOpenAddModal = () => {
    resetForm()
    setEditingId(null)
    setError(null)
    setShowFormModal(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id)
    setError(null)
    const imgs = normalizeProductImages(product.images)
    setFormImages(imgs)
    setFormName(product.name)
    setFormSlug(product.slug)
    setFormDescription(product.description)
    setFormCategory(product.category)
    setFormPrice(product.price)
    setFormDiscount(product.discount)
    setFormStock(product.stock)
    setFormSku(product.sku)
    setFormIsFeatured(product.isFeatured)
    setFormIsActive(product.isActive)
    setShowFormModal(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formImages.length === 0) {
      setError('At least one product image is required.')
      return
    }
    if (!formName.trim() || !formSku.trim()) {
      setError('Product name and SKU are required.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.trim().toLowerCase().replace(/\s+/g, '-'),
      description: formDescription.trim(),
      category: formCategory,
      price: Number(formPrice),
      discount: Number(formDiscount),
      stock: Number(formStock),
      sku: formSku.trim(),
      images: formImages.map((img, idx) => ({
        url: img.url,
        publicId: img.publicId,
        order: idx,
        isPrimary: idx === 0,
      })),
      isFeatured: formIsFeatured,
      isActive: formIsActive,
    }

    try {
      if (editingId) {
        const updated = await updateProduct(editingId, payload)
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      } else {
        const created = await createProduct(payload)
        setProducts((prev) => [created, ...prev])
      }
      setShowFormModal(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setDeleteTargetId(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete product.'))
      setDeleteTargetId(null)
    }
  }

  const getPrimaryImg = (p: Product): string => {
    const imgs = normalizeProductImages(p.images)
    const primary = imgs.find((i) => i.isPrimary)
    return primary?.url || imgs[0]?.url || ''
  }

  return (
    <div className="space-y-6">
      {error && !showFormModal && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:underline">✕</button>
        </div>
      )}

      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage products · Multiple images via Cloudinary</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
          + Add New Product
        </Button>
      </div>

      {loadingProducts ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">No products yet. Create your first product.</p>
          <Button variant="primary" size="sm" onClick={handleOpenAddModal}>+ Add Product</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Images</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => {
                const imgs = normalizeProductImages(product.images)
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={getPrimaryImg(product)} alt="" className="w-10 h-10 rounded-lg object-cover border" />
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
                      <div className="flex -space-x-2">
                        {imgs.slice(0, 4).map((img, i) => (
                          <img key={i} src={img.url} alt="" className="w-8 h-8 rounded-md object-cover border-2 border-white shadow-sm" />
                        ))}
                        {imgs.length > 4 && (
                          <span className="w-8 h-8 rounded-md bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                            +{imgs.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(product)} className="text-xs text-emerald-600 hover:underline font-bold">Edit</button>
                      <button onClick={() => setDeleteTargetId(product.id)} className="text-xs text-rose-600 hover:underline font-bold">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
            <p className="text-xs text-gray-500">This will permanently remove the product and cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="flex-1">Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(deleteTargetId)} className="flex-1">Delete Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3">
                {error}
                <button onClick={() => setError(null)} className="ml-2 font-bold hover:underline">✕</button>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <Input
                label="Product Title *"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category *"
                  value={formCategory}
                  options={INITIAL_CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
                  onChange={setFormCategory}
                />
                <Input
                  label="SKU Code *"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Price (৳) *"
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  required
                />
                <Input
                  label="Discount %"
                  type="number"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(Number(e.target.value))}
                />
                <Input
                  label="Stock *"
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Multi-image uploader */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <ProductImageUploader
                  images={formImages}
                  onChange={setFormImages}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Active Status
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFormModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="flex-1 font-bold"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
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