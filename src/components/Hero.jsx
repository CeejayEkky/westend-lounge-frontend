import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiPlay } from 'react-icons/fi'
import HeroBg from '../assets/img4.jpg' // ✅ Proper Vite asset import

const Hero = () => {
  // ✅ Safe window dimensions — avoids SSR crash and hydration warnings
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* ✅ Background uses imported asset variable, not raw string path */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${HeroBg})`,
          backgroundSize: 'cover'
        }}
      />

      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-westend-gold rounded-full"
            initial={{
              x: Math.random() * dimensions.width,   // ✅ Safe — only runs after mount
              y: Math.random() * dimensions.height,
              opacity: 0
            }}
            animate={{
              y: [null, -100, -200],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="inline-block mb-4"
          >
            <span className="bg-westend-gold/20 backdrop-blur-sm text-westend-gold px-4 py-2 rounded-full text-sm font-semibold">
              🔥 Lagos' #1 Nightlife Destination 🔥
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black mb-6">
            Welcome to{' '}
            <span className="text-gradient animate-glow">
              Westend Lounge
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the best of Akowonjo – Live Band, Grilled Catfish, Premium Drinks, and Unforgettable Vibes
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-westend-gold text-westend-dark px-8 py-3 rounded-full font-semibold text-lg inline-flex items-center gap-2 hover:shadow-lg hover:shadow-westend-gold/50 transition-all"
              >
                Order Now <FiArrowRight />
              </motion.button>
            </Link>

            <Link to="/reservation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold text-lg inline-flex items-center gap-2 hover:bg-white hover:text-westend-dark transition-all"
              >
                <FiPlay /> Book a Table
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </div>
  )
}

export default Hero