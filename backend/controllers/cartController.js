const Cart = require('../models/Cart')
const Product = require('../models/Product')

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price discount images stock sku')
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] })
    }
    res.status(200).json({ success: true, cart })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching cart.' })
  }
}

// @desc    Add or update item in cart
// @route   POST /api/cart/items
// @access  Private
const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' })
  }

  try {
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    let cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] })
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    )

    const effectivePrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity)
      if (cart.items[itemIndex].quantity < 1) {
        cart.items.splice(itemIndex, 1)
      }
    } else {
      cart.items.push({
        product: product._id,
        productName: product.name,
        productImage: product.images?.[0] || '',
        price: effectivePrice,
        quantity: Number(quantity),
      })
    }

    await cart.save()
    const updated = await Cart.findById(cart._id).populate('items.product', 'name price discount images stock sku')
    res.status(200).json({ success: true, message: 'Cart updated.', cart: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating cart.' })
  }
}

// @desc    Update item quantity
// @route   PATCH /api/cart/items/:productId
// @access  Private
const updateCartItemQuantity = async (req, res) => {
  const { productId } = req.params
  const { quantity } = req.body

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ success: false, message: 'Valid quantity is required.' })
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' })
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    )

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart.' })
    }

    if (Number(quantity) === 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = Number(quantity)
    }

    await cart.save()
    const updated = await Cart.findById(cart._id).populate('items.product', 'name price discount images stock sku')
    res.status(200).json({ success: true, message: 'Cart item updated.', cart: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating cart item.' })
  }
}

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeCartItem = async (req, res) => {
  const { productId } = req.params

  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' })
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    )

    await cart.save()
    const updated = await Cart.findById(cart._id).populate('items.product', 'name price discount images stock sku')
    res.status(200).json({ success: true, message: 'Item removed from cart.', cart: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error removing item.' })
  }
}

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (cart) {
      cart.items = []
      await cart.save()
    }
    res.status(200).json({ success: true, message: 'Cart cleared.', cart })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error clearing cart.' })
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
}
