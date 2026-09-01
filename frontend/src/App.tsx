import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocialProvider } from '@/contexts/SocialContext'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocialProvider>
          <CartProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </CartProvider>
        </SocialProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}