import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin'

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/products', label: 'Products Management', icon: '📦' },
    { to: '/admin/orders', label: 'Orders & Fulfillment', icon: '🛒' },
    { to: '/admin/customers', label: 'Customer Accounts', icon: '👥' },
    { to: '/admin/reviews', label: 'Customer Reviews', icon: '⭐' },
    { to: '/admin/subscribers', label: 'Subscribers List', icon: '📧' },
    { to: '/admin/campaigns', label: 'Email Campaigns', icon: '📨' },
    { to: '/admin/social', label: 'Social Media Settings', icon: '🌐' },
    { to: '/admin/payment-methods', label: 'Payment Methods', icon: '💳' },
    { to: '/admin/shipping-cod', label: 'Shipping & COD', icon: '🚚' },
    ...(isSuperAdmin
      ? [{ to: '/admin/admin-management', label: 'Admin Management', icon: '🛡️' }]
      : []),
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex relative">
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR — FULL HEIGHT VIEWPORT (Top edge to Bottom edge)        */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-gray-900 text-white z-40 border-r border-gray-800 flex-shrink-0">
        {/* Brand / Logo Header at very top */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow">
              BD
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white block leading-none">
                Admin <span className="text-emerald-400">Panel</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Management Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation Links — Internal Vertical Scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-3 mb-3">
            Main Navigation
          </p>

          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Profile & Actions at Bottom of Sidebar */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase ${
                  isSuperAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-2 rounded-lg font-semibold text-center transition-colors text-[11px]"
            >
              Storefront
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 py-1.5 px-2 rounded-lg font-semibold text-center transition-colors text-[11px]"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER — FULL HEIGHT OFF-CANVAS                                  */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Full Height Off-canvas Sidebar */}
          <aside className="relative w-64 max-w-xs h-full bg-gray-900 text-white flex flex-col z-10 shadow-2xl">
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                  BD
                </div>
                <span className="font-extrabold text-sm text-white">Admin Panel</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="text-gray-400 hover:text-white p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Navigation
              </p>
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-950">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white truncate">{user?.name}</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full uppercase font-bold">
                  {user?.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false)
                    navigate('/')
                  }}
                  className="bg-gray-800 text-gray-300 py-1.5 rounded-lg text-center font-semibold text-[11px]"
                >
                  Storefront
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-rose-600 text-white py-1.5 rounded-lg text-center font-semibold text-[11px]"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT AREA (Header + Content Body)                               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar above content */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Open Mobile Navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-sm font-bold text-gray-800">
              Bangladesh Commerce <span className="text-gray-400 font-normal">| Admin Panel</span>
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>🛒 View Customer Storefront</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout