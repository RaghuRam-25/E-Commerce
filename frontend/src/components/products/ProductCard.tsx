import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/types'
import { useCart } from '@/contexts/CartContext'

interface ProductCardProps {
  product: Product
  showRating?: boolean
  showActions?: boolean
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showRating = true,
  showActions = true,
}) => {
  const { addItem } = useCart()
  const hasDiscount = product.discount > 0
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discount / 100)
    : product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
  }

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            -{product.discount}%
          </div>
        )}
        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {product.category}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`} className="hover:text-emerald-600 transition-colors">
            <h3 className="font-semibold text-gray-900 line-clamp-1 text-base">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-500 text-xs line-clamp-2 mt-1">
            {product.description || 'Quality product available for delivery.'}
          </p>
        </div>

        <div className="mt-3">
          {showRating && (
            <div className="flex items-center gap-1 text-xs text-amber-500 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= Math.round(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.57l-6.18 3.21L5 12.27l-1.18-6.88L12 9.27l-5-4.87L3.91 6.26L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="font-medium text-gray-700 ml-1">{product.rating || 4.5}</span>
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-600">
              ৳{finalPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Add to Cart
            </button>
            <Link
              to={`/products/${product.id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
            >
              Details
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

ProductCard.displayName = 'ProductCard'