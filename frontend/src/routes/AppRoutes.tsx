import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ProductDetailsPage } from '@/pages/ProductDetailsPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { LoginPage } from '@/pages/Auth/LoginPage'
import { RegisterPage } from '@/pages/Auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/Auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/Auth/ResetPasswordPage'

import { CustomerProfilePage } from '@/pages/Customer/CustomerProfilePage'
import { CustomerOrdersPage } from '@/pages/Customer/CustomerOrdersPage'
import { CustomerReviewsPage } from '@/pages/Customer/CustomerReviewsPage'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminDashboardPage } from '@/pages/Admin/DashboardPage'
import { AdminProductsPage } from '@/pages/Admin/ProductsPage'
import { AdminOrdersPage } from '@/pages/Admin/OrdersPage'
import { AdminCustomersPage } from '@/pages/Admin/CustomersPage'
import { AdminManagementPage } from '@/pages/Admin/AdminManagementPage'
import { AdminSocialPage } from '@/pages/Admin/AdminSocialPage'
import { AdminSubscribersPage } from '@/pages/Admin/AdminSubscribersPage'
import { AdminCampaignsPage } from '@/pages/Admin/AdminCampaignsPage'
import { AdminReviewsPage } from '@/pages/Admin/AdminReviewsPage'
import { AdminPaymentMethodsPage } from '@/pages/Admin/PaymentMethodsPage'
import { AdminShippingCodSettingsPage } from '@/pages/Admin/AdminShippingCodSettingsPage'

import { ProtectedRoute } from '@/routes/ProtectedRoute'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Storefront Routes wrapped in Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />

        {/* Public Auth Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected Customer Routes */}
        <Route
          path="customer/profile"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']}>
              <CustomerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/orders"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']}>
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="customer/reviews"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']}>
              <CustomerReviewsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Protected Admin Routes wrapped in Admin Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="subscribers" element={<AdminSubscribersPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="social" element={<AdminSocialPage />} />
        <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
        <Route path="shipping-cod" element={<AdminShippingCodSettingsPage />} />

        {/* Super Admin ONLY Route */}
        <Route
          path="admin-management"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
