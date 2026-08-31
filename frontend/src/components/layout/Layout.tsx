import React, { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { Footer } from '@/components/layout/Footer'

export const Layout: React.FC = () => {
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ]

  const isStaff = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Top Announcement Banner */}
      <div className="bg-emerald-700 text-white text-xs py-2 px-4 text-center font-medium">
        🎉 Free Delivery across Bangladesh on orders over ৳2000! | Call to Order: +880 1234 567890
      </div>

      {/* Main Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-emerald-700 transition-colors">
                BD
              </div>
              <div>
                <span className="text-xl font-extrabold text-emerald-600 tracking-tight">Bangladesh</span>
                <span className="text-lg font-bold text-gray-800 tracking-tight">Commerce</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-emerald-600 ${
                      isActive ? 'text-emerald-600 font-semibold' : 'text-gray-600'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions / Auth Links */}
            <div className="flex items-center gap-3">
              {/* Cart Link */}
              <Link
                to="/cart"
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all bg-white"
                aria-label="View Cart"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="hidden sm:inline text-xs font-semibold">Cart</span>
                <span className="bg-emerald-600 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              </Link>

              {/* Dynamic Auth State Controls */}
              {isAuthenticated && user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {/* Admin Portal Button if Admin or Super Admin */}
                  {isStaff && (
                    <Link
                      to="/admin"
                      className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>⚙️ Admin Panel</span>
                    </Link>
                  )}

                  {/* Super Admin Management Button */}
                  {isSuperAdmin && (
                    <Link
                      to="/admin/admin-management"
                      className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>🛡️ Roles</span>
                    </Link>
                  )}

                  {/* Customer Orders */}
                  {user.role === 'customer' && (
                    <Link
                      to="/customer/orders"
                      className="text-xs font-semibold text-gray-700 hover:text-emerald-600 px-2 py-2"
                    >
                      My Orders
                    </Link>
                  )}

                  {/* Customer Profile */}
                  <Link
                    to="/customer/profile"
                    className="text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>👤 {user.name.split(' ')[0]}</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                /* Guest Auth Buttons */
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold text-gray-700 hover:text-emerald-600 px-3 py-2 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated && user ? (
              <div className="pt-2 border-t border-gray-100 space-y-1">
                <p className="text-xs font-bold text-gray-400 px-3">Logged in as {user.name}</p>
                {isStaff && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-emerald-600 font-bold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {isSuperAdmin && (
                  <Link
                    to="/admin/admin-management"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-purple-700 font-bold"
                  >
                    Admin Management
                  </Link>
                )}
                <Link
                  to="/customer/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-gray-700"
                >
                  My Orders
                </Link>
                <Link
                  to="/customer/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-gray-700"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                    navigate('/login')
                  }}
                  className="block w-full text-left px-3 py-2 text-rose-600 font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-3 py-2 rounded-lg border border-gray-200 font-semibold text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-3 py-2 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Register Customer Account
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Dynamic Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Reusable Global Footer */}
      <Footer />
    </div>
  )
}

export default Layout
