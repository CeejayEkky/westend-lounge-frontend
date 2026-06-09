import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from '../utils/api'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })

  const handleLogin = async (email, password) => {
    console.log('🔐 handleLogin called with:', { email, password: '***' })
    setLoading(true)
    
    try {
      console.log('📡 Sending login request to /auth/login')
      const response = await api.post('/auth/login', { email, password })
      
      console.log('📦 Full response received:', response)
      console.log('📦 Response data:', response.data)
      console.log('📦 Response status:', response.status)
      
      if (response.data.success) {
        const { token, user } = response.data
        
        console.log('👤 User object:', user)
        console.log('👤 User role:', user.role)
        console.log('👤 Is admin?', user.role === 'admin')
        
        // Store in localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        console.log('💾 Token stored:', localStorage.getItem('token'))
        console.log('💾 User stored:', localStorage.getItem('user'))
        
        // ✅ Dispatch custom event to notify Navbar and other components
        window.dispatchEvent(new Event('user-login'))
        console.log('📡 Dispatched user-login event')
        
        toast.success(`Welcome back, ${user.name}!`)
        
        // Small delay to ensure event is processed
        setTimeout(() => {
          // Redirect based on role
          if (user.role === 'admin') {
            console.log('🚀 Redirecting to /admin')
            navigate('/admin')
          } else {
            console.log('🚀 Redirecting to /')
            navigate('/')
          }
        }, 100)
      } else {
        console.log('❌ Login failed: success false')
        toast.error(response.data.message || 'Login failed')
      }
    } catch (error) {
      console.error('❌ Login error details:', error)
      console.error('❌ Error response:', error.response)
      console.error('❌ Error message:', error.message)
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status)
        console.error('❌ Response data:', error.response.data)
        toast.error(error.response.data?.message || `Server error: ${error.response.status}`)
      } else if (error.request) {
        console.error('❌ No response received from server')
        toast.error('Cannot connect to server. Is the backend running?')
      } else {
        toast.error(error.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (name, email, password, phone) => {
    console.log('📝 handleRegister called')
    setLoading(true)
    
    try {
      const response = await api.post('/auth/register', { name, email, password, phone })
      
      console.log('📦 Register response:', response.data)
      
      if (response.data.success) {
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // ✅ Dispatch custom event for registration too
        window.dispatchEvent(new Event('user-login'))
        
        toast.success('Account created successfully!')
        
        setTimeout(() => {
          navigate('/')
        }, 100)
      }
    } catch (error) {
      console.error('❌ Register error:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('📝 Form submitted, isLogin:', isLogin)
    
    if (isLogin) {
      await handleLogin(formData.email, formData.password)
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        toast.error('Please fill all fields')
        return
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      await handleRegister(formData.name, formData.email, formData.password, formData.phone)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-32 pb-20 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-effect rounded-3xl p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                  required={!isLogin}
                />
              </div>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
                  required={!isLogin}
                />
              </div>
            </>
          )}
          
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
              required
            />
          </div>
          
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-10 pr-12 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-westend-gold focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-westend-gold transition-colors"
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-westend-gold text-westend-dark py-3 rounded-full font-semibold text-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </motion.button>
        </form>
        
        <p className="text-center mt-4 text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin)
              setFormData({ name: '', email: '', password: '', phone: '' })
            }} 
            className="text-westend-gold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}

export default Login