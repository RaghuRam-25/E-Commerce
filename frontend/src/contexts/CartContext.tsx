import React, { createContext, useContext, useState, useEffect } from 'react'
import type { CartItem, CartState, Product } from '../types'

const CartContext = createContext<CartState | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode; initialItems?: CartItem[] }> = ({
  children,
  initialItems,
}) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('cart')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to parse stored cart:', e)
    }
    return initialItems || []
  })

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e)
    }
  }, [items])

  const total = items.reduce((sum, item) => {
    const itemPrice = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price
    return sum + itemPrice * item.quantity
  }, 0)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const addItem = (product: Product) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === product.id)
      if (existingIndex > -1) {
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        }
        return updated
      }
      return [
        ...prevItems,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || '/placeholder-product.svg',
          price: product.price,
          discount: product.discount || 0,
          quantity: 1,
        },
      ]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId))
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}