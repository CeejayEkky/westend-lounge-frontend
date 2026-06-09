import React from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiCheck, FiX } from 'react-icons/fi'

const ReservationCard = ({ reservation, onConfirm, onCancel, index }) => {
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500 border-green-500',
    cancelled: 'bg-red-500/20 text-red-500 border-red-500',
    completed: 'bg-blue-500/20 text-blue-500 border-blue-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-effect rounded-2xl p-6 card-hover"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{reservation.name}</h3>
          <p className="text-gray-400 text-sm">{reservation.email} • {reservation.phone}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[reservation.status]}`}>
          {reservation.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-300">
          <FiCalendar className="text-westend-gold" />
          <span>{reservation.date}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <FiClock className="text-westend-gold" />
          <span>{reservation.time}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <FiUsers className="text-westend-gold" />
          <span>{reservation.guests} {reservation.guests === 1 ? 'Guest' : 'Guests'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <FiMapPin className="text-westend-gold" />
          <span>Table {reservation.tableNumber || 'TBD'}</span>
        </div>
      </div>

      {reservation.specialRequests && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-400">Special Requests:</p>
          <p className="text-sm">{reservation.specialRequests}</p>
        </div>
      )}

      {reservation.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(reservation.id)}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
          >
            <FiCheck /> Confirm
          </button>
          <button
            onClick={() => onCancel(reservation.id)}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition"
          >
            <FiX /> Cancel
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default ReservationCard