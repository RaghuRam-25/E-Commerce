import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocialProvider } from '@/contexts/SocialContext'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocialProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </SocialProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}