import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/products/ProductCard'
import { useCart } from '@/contexts/CartContext'
import { INITIAL_PRODUCTS } from '@/services/mockData'

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const product = INITIAL_PRODUCTS.find((p) => p.id === id) || INITIAL_PRODUCTS[0]
  const [selectedImage, setSelectedImage] = useState<string>(product.images?.[0] || '')
  const [quantity, setQuantity] = useState<number>(1)
  const [addedNotice, setAddedNotice] = useState<boolean>(false)

  const activeImage = selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  const hasDiscount = product.discount > 0
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discount / 100)
    : product.price

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    setAddedNotice(true)
    setTimeout(() => setAddedNotice(false), 3000)
  }

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    navigate('/checkout')
  }

  const relatedProducts = INITIAL_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Display */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Image Thumbnails if available */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">{product.category}</Badge>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                In Stock ({product.stock} items)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.rating || 5) ? 'fill-amber-400' : 'fill-gray-200 text-gray-200'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.57l-6.18 3.21L5 12.27l-1.18-6.88L12 9.27l-5-4.87L3.91 6.26L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">{product.rating || 4.5}</span>
              <span className="text-xs text-gray-400">| SKU: {product.sku}</span>
            </div>

            {/* Price Display */}
            <div className="flex items-baseline gap-3 my-5">
              <span className="text-3xl font-black text-emerald-600">
                ৳{finalPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  ৳{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-b border-gray-100 py-4 my-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-gray-700 block">Select Quantity:</label>
              <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 text-base font-bold transition-colors"
                >
                  -
                </button>
                <span className="px-5 py-2 font-bold text-sm text-gray-900 bg-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 text-base font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            {addedNotice && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-fade-in">
                <span>✓ Added {quantity} item(s) to your shopping cart!</span>
                <Link to="/cart" className="underline font-bold">View Cart</Link>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 font-bold py-3.5"
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleBuyNow}
                className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold py-3.5"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Related Products in {product.category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}