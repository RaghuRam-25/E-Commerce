import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/products/ProductCard'
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/services/mockData'
import { NewsletterSubscribe } from '@/components/newsletter/NewsletterSubscribe'

const businessHighlights = [
  {
    id: '1',
    title: 'Fast Delivery',
    description: 'Quick 2-3 business days delivery across all 64 districts in Bangladesh.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: '2',
    title: 'Cash on Delivery',
    description: 'Pay safely when your package arrives directly at your doorstep.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: '3',
    title: '100% Quality Verified',
    description: 'Carefully curated selection of authentic and premium products.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: '4',
    title: '24/7 Dedicated Support',
    description: 'Our customer care team is always ready to assist you anytime.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export const HomePage: React.FC = () => {
  const featuredProducts = INITIAL_PRODUCTS.filter((p) => p.isFeatured)

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 text-white overflow-hidden py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold tracking-wider uppercase border border-emerald-500/30">
                Premium E-Commerce Platform
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                Quality Products, <br />
                <span className="text-emerald-400">Delivered Fast.</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Explore top-rated fashion, electronics, home essentials, and sports gear at competitive prices with guaranteed quality across Bangladesh.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link to="/products">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-emerald-900/50">
                    Browse All Products
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-400 text-white hover:bg-white/10">
                    About Our Store
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto lg:mx-0 max-w-md lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                  alt="Shop Banner"
                  className="w-full h-80 lg:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent flex items-end p-6">
                  <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 text-gray-900 shadow-lg w-full">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase">Special Launch Discount</p>
                        <p className="text-lg font-black">Up to 25% Off Featured Items</p>
                      </div>
                      <Link to="/products" className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessHighlights.map((highlight) => (
            <div
              key={highlight.id}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="p-3 bg-emerald-50 rounded-xl flex-shrink-0">
                {highlight.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{highlight.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {INITIAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-xl p-5 border border-gray-200 text-center hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-110 transition-transform">
                {cat.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Top Choices</span>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            Explore All Products →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Reusable Newsletter Component */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NewsletterSubscribe />
      </section>
    </div>
  )
}

export default HomePage