import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/products/ProductCard'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/services/mockData'

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCat = searchParams.get('category') || ''

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCat)
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(30000)
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'popular' | 'newest'>('popular')

  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = product.name.toLowerCase().includes(q)
        const matchDesc = product.description.toLowerCase().includes(q)
        const matchCat = product.category.toLowerCase().includes(q)
        if (!matchName && !matchDesc && !matchCat) return false
      }
      // Price filter
      const price = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price
      if (price < minPrice || price > maxPrice) {
        return false
      }
      return true
    }).sort((a, b) => {
      const priceA = a.discount > 0 ? a.price * (1 - a.discount / 100) : a.price
      const priceB = b.discount > 0 ? b.price * (1 - b.discount / 100) : b.price

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB
        case 'price-desc':
          return priceB - priceA
        case 'popular':
          return b.rating - a.rating
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy])

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName)
    if (catName) {
      setSearchParams({ category: catName })
    } else {
      setSearchParams({})
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setMinPrice(0)
    setMaxPrice(30000)
    setSortBy('popular')
    setSearchParams({})
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Our Product Collection</h1>
        <p className="text-gray-500 text-sm mt-1">
          Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Search Products"
            type="text"
            placeholder="e.g. shirt, watch, shoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            label="Category"
            value={selectedCategory}
            options={[
              { value: '', label: 'All Categories' },
              ...INITIAL_CATEGORIES.map((cat) => ({ value: cat.name, label: cat.name })),
            ]}
            onChange={handleCategorySelect}
          />

          <Select
            label="Sort By"
            value={sortBy}
            options={[
              { value: 'popular', label: 'Top Rated & Popular' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'newest', label: 'Newest Arrivals' },
            ]}
            onChange={(val) => setSortBy(val as any)}
          />

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full py-2.5 text-xs text-gray-600 hover:text-rose-600 border-gray-300"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Price Slider / Quick Filter Tags */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Quick Category Filter:</span>
            <button
              onClick={() => handleCategorySelect('')}
              className={`px-3 py-1 rounded-full transition-colors ${!selectedCategory ? 'bg-emerald-600 text-white font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              All
            </button>
            {INITIAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.name)}
                className={`px-3 py-1 rounded-full transition-colors ${selectedCategory === cat.name ? 'bg-emerald-600 text-white font-medium' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Display Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 my-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500 text-xs mb-6">
            Try adjusting your search keywords or category filters to find what you are looking for.
          </p>
          <Button variant="primary" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}