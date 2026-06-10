import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiShoppingCart, FiUser } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import Logo from '../assets/logo2.jpg'
import NotificationBell from './NotificationBell'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const cartItems = useSelector(state => state.cart.items)

  const loadUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch {
        localStorage.removeItem('user')
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadUser()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    const handleLoginEvent = () => loadUser()
    window.addEventListener('user-login', handleLoginEvent)
    window.addEventListener('user-logout', () => setUser(null))
    return () => {
      window.removeEventListener('user-login', handleLoginEvent)
      window.removeEventListener('user-logout', () => {})
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Reservations', path: '/reservation' },
    { name: 'My Reservations', path: '/my-reservations' },
    { name: 'Track Order', path: '/track-order' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.dispatchEvent(new Event('user-logout'))
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleSignIn = () => {
    setIsOpen(false)
    navigate('/login')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-westend-dark backdrop-blur-md py-4 shadow-lg'
            : 'bg-westend-dark/80 backdrop-blur-sm py-6'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/">
            <img
              src={Logo}
              alt="Westend Lounge"
              className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className={`relative text-lg font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'text-westend-gold'
                      : 'text-white hover:text-westend-gold'
                  }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="underline"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-westend-gold"
                    />
                  )}
                </motion.span>
              </Link>
            ))}

            <Link to="/checkout">
              <motion.div whileHover={{ scale: 1.1 }} className="relative cursor-pointer">
                <FiShoppingCart className="text-2xl text-white hover:text-westend-gold transition-colors" />
                {cartItems.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {cartItems.length}
                  </motion.span>
                )}
              </motion.div>
            </Link>

            {/* ✅ FIXED: Single user section with NotificationBell */}
            {user ? (
              <div className="flex items-center gap-4">
                {console.log('🔔 Rendering NotificationBell for user:', user)}
                <NotificationBell userId={user.id} userEmail={user.email} />
                <span className="text-westend-gold">Hi, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleSignIn}
                className="bg-westend-gold text-westend-dark px-6 py-2 rounded-full font-semibold hover:bg-westend-amber transition-colors"
              >
                <FiUser className="inline mr-2" /> Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden cursor-pointer text-white text-3xl z-50 relative"
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 h-full bg-westend-dark/95 backdrop-blur-xl z-50 md:hidden shadow-2xl"
            >
              <div className="pt-24 px-6 pb-8 h-full flex flex-col">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute cursor-pointer top-6 right-6 text-white text-2xl"
                >
                  <FiX />
                </button>

                <div className="flex flex-col space-y-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-xl py-2 border-b border-white/10 ${
                        location.pathname === link.path
                          ? 'text-westend-gold font-semibold'
                          : 'text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}

                  <Link to="/checkout" onClick={() => setIsOpen(false)}>
                    <div className="text-xl py-2 border-b border-white/10 text-white flex justify-between items-center">
                      Cart
                      {cartItems.length > 0 && (
                        <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </div>
                  </Link>

                  {user ? (
                    <>
                      <div className="text-white py-2">Welcome, {user.name}</div>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className="bg-red-500 text-white py-3 rounded-full font-semibold mt-4 transition-colors hover:bg-red-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="bg-westend-gold text-westend-dark py-3 rounded-full font-semibold mt-4 transition-colors hover:bg-westend-amber"
                    >
                      <FiUser className="inline mr-2" /> Sign In
                    </button>
                  )}
                </div>

                <div className="mt-auto pt-8 text-center text-gray-400 text-sm">
                  <p>139 Akowonjo Road, Lagos</p>
                  <p className="mt-1">Open 12 PM - 3 AM</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar