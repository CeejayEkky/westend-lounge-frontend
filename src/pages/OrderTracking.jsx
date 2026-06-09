import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiClock, FiPackage, FiCheck, FiXCircle, FiArrowLeft } from 'react-icons/fi'
import { supabase } from '../config/supabaseClient'
import api from '../utils/api'
import toast from 'react-hot-toast'

const OrderTracking = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [subscription, setSubscription] = useState(null)

  const steps = [
    { name: 'Order Received', icon: FiPackage, statuses: ['pending', 'paid'] },
    { name: 'Preparing', icon: FiClock, statuses: ['preparing'] },
    { name: 'Ready for Pickup', icon: FiCheckCircle, statuses: ['ready'] },
    { name: 'Completed', icon: FiCheck, statuses: ['completed'] },
  ]

  const statusToStep = (status) => {
    if (status === 'cancelled') return -1
    const index = steps.findIndex(step => step.statuses.includes(status))
    return index >= 0 ? index : 0
  }

  const getStatusMessage = (status) => {
    switch(status) {
      case 'pending':
        return '⏳ Waiting for payment confirmation...'
      case 'paid':
        return '✅ Payment confirmed! Preparing your order...'
      case 'preparing':
        return '🔥 Chef is cooking your meal!'
      case 'ready':
        return '🎉 Order ready for pickup!'
      case 'completed':
        return '❤️ Order completed! Thank you!'
      case 'cancelled':
        return '❌ Order cancelled'
      default:
        return 'Processing...'
    }
  }

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      // Validate orderId
      if (!orderId || orderId === '123' || orderId === 'undefined') {
        console.error('Invalid order ID:', orderId)
        setLoading(false)
        setOrder(null)
        toast.error('Invalid order ID. Please check your tracking link.')
        return
      }

      try {
        console.log('🔍 Fetching order:', orderId)
        const response = await api.get(`/orders/${orderId}`)
        
        if (response.data.success) {
          setOrder(response.data.data)
          setCurrentStep(statusToStep(response.data.data.status))
        } else {
          toast.error('Order not found')
          setOrder(null)
        }
      } catch (error) {
        console.error('❌ Error fetching order:', error)
        if (error.response?.status === 404) {
          toast.error('Order not found. Please check your order ID.')
        } else {
          toast.error('Failed to load order details')
        }
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  // Supabase real-time subscription
  useEffect(() => {
    if (!order || !order.id) return

    console.log('📡 Setting up real-time subscription for order:', order.id)

    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload.new)
          const updatedOrder = payload.new
          setOrder(prev => ({ ...prev, ...updatedOrder }))
          const newStep = statusToStep(updatedOrder.status)
          setCurrentStep(newStep)

          // Show notifications based on status change
          if (updatedOrder.status === 'preparing') {
            toast.success('🔥 Chef is preparing your order!', { duration: 4000 })
          } else if (updatedOrder.status === 'ready') {
            toast.success('🎉 Your order is ready for pickup!', { duration: 6000 })
          } else if (updatedOrder.status === 'completed') {
            toast.success('❤️ Order completed! Thank you for choosing Westend!', { duration: 5000 })
          } else if (updatedOrder.status === 'cancelled') {
            toast.error('❌ Your order has been cancelled')
          }
        }
      )
      .subscribe()

    setSubscription(channel)

    return () => {
      if (channel) {
        console.log('📡 Cleaning up subscription')
        channel.unsubscribe()
      }
    }
  }, [order])

  const handleGoBack = () => {
    navigate('/track-order')
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold mx-auto mb-4" />
          <p className="text-gray-400">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-400 mb-6">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold hover:bg-westend-amber transition-colors inline-flex items-center gap-2"
          >
            <FiArrowLeft /> Track Another Order
          </button>
        </div>
      </div>
    )
  }

  if (order.status === 'cancelled') {
    return (
      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Cancelled</h2>
          <p className="text-gray-400 mb-6">
            This order has been cancelled. If you have any questions, please contact us.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold hover:bg-westend-amber transition-colors inline-flex items-center gap-2"
          >
            <FiArrowLeft /> Track Another Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen">
      <div className="container mx-auto max-w-3xl">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 text-gray-400 hover:text-westend-gold transition-colors inline-flex items-center gap-2"
        >
          <FiArrowLeft /> Track Another Order
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-400">Order ID: {order.order_id}</p>
          <p className="text-sm text-westend-gold mt-1">
            {getStatusMessage(order.status)}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="glass-effect rounded-3xl p-8 mb-8">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-8 h-1 bg-white/20 rounded-full">
              <motion.div
                className="h-full bg-westend-gold rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: currentStep >= 0 ? `${(currentStep / (steps.length - 1)) * 100}%` : '0%' }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index <= currentStep && currentStep >= 0
                const isCurrent = index === currentStep

                return (
                  <div key={index} className="text-center" style={{ flex: 1 }}>
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all ${
                        isActive
                          ? 'bg-westend-gold text-westend-dark shadow-lg shadow-westend-gold/50'
                          : 'bg-white/20 text-gray-400'
                      }`}
                    >
                      <Icon className="text-2xl" />
                    </motion.div>
                    <p className="font-semibold text-sm hidden sm:block">{step.name}</p>
                    {isCurrent && (
                      <p className="text-xs text-westend-gold mt-2 animate-pulse">
                        {order.status === 'preparing' && '⏳ Being prepared...'}
                        {order.status === 'ready' && '✅ Ready for pickup!'}
                        {order.status === 'paid' && '⏳ Waiting for kitchen...'}
                        {order.status === 'pending' && '⏳ Waiting for payment...'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="glass-effect rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-4">Order Details</h2>

          <div className="space-y-3 mb-6">
            {order.order_items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-300">
                  {item.name} 
                  <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                </span>
                <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-white/20 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-westend-gold text-xl">₦{order.total_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                order.payment_status === 'success' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {order.payment_status === 'success' ? '✓ Paid' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-semibold mb-1">Pickup / Delivery Location</p>
                <p className="text-sm text-gray-400">
                  {order.pickup_type === 'delivery'
                    ? order.delivery_address
                    : 'Westend Lounge, 139 Akowonjo Road, Alimosho, Lagos'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = 'tel:+2348037227263'}
              className="mt-4 text-westend-gold hover:underline transition-colors inline-flex items-center gap-2"
            >
              📞 Contact Restaurant
            </button>
          </div>
        </div>

        {/* Need Help? */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-westend-gold/10 rounded-lg border border-westend-gold/30 text-center"
        >
          <p className="text-sm">
            🎸 Live band starts at 8 PM tonight! Come early for good seats.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Need help? Call us at <span className="text-westend-gold">+234 803 722 7263</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default OrderTracking