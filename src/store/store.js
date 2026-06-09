import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './cartSlice'  // ✅ Fixed import path

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
})