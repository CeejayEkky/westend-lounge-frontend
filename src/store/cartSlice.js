import { createSlice } from '@reduxjs/toolkit'

// ✅ Helper: safely parse price regardless of format
// Handles "₦5,000", "5000", 5000, or any mixed string
const parsePrice = (price) => {
  if (typeof price === 'number') return price
  if (typeof price === 'string') {
    // Strip currency symbol, commas, and whitespace, then parse
    const cleaned = price.replace(/[₦,\s]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const calculateTotal = (items) =>
  items.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1 })
      }
      // ✅ Always recalculate using the safe parser
      state.totalAmount = calculateTotal(state.items)
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload.id)
      state.totalAmount = calculateTotal(state.items)
    },

    updateQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload.id)
      if (item) {
        item.quantity = action.payload.quantity
        state.totalAmount = calculateTotal(state.items)
      }
    },

    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions

// ✅ Export the helper so Checkout.jsx can use it too for display
export { parsePrice }

export default cartSlice.reducer