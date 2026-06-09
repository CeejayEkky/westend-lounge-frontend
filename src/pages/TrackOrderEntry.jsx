import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSearch, FiPackage } from 'react-icons/fi'
import api from '../utils/api'
import toast from 'react-hot-toast'

const TrackOrderEntry = () => {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!orderId.trim()) {
      toast.error('Please enter your order ID')
      return
    }
    
    setLoading(true)
    
    try {
      // Check if order exists
      const response = await api.get(`/orders/${orderId}`)
      
      if (response.data.success) {
        // Order exists, navigate to tracking page
        navigate(`/track-order/${orderId}`)
      } else {
        toast.error('Order not found')
      }
    } catch (error) {
      console.error('Error checking order:', error)
      if (error.response?.status === 404) {
        toast.error('Order not found. Please check your order ID.')
      } else {
        toast.error('Error checking order. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-3xl p-8 max-w-md w-full text-center"
      >
        <FiPackage className="text-6xl text-westend-gold mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-gray-400 mb-6">
          Enter your order ID to get real-time updates on your meal
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="e.g., WE-20231215-1234"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none text-center"
            autoComplete="off"
          />
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-westend-gold text-westend-dark py-3 rounded-full font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-westend-dark"></div>
                Checking...
              </>
            ) : (
              <>
                <FiSearch /> Track Order
              </>
            )}
          </motion.button>
        </form>
        
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <p className="text-xs text-gray-400">
            💡 Your order ID was sent to your email after checkout
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Example: WE-20240315-1234
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default TrackOrderEntry