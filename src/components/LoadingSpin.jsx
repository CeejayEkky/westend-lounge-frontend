import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-westend-dark/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-westend-gold border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-westend-gold font-semibold">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner