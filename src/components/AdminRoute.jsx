import React from 'react'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const userRaw = localStorage.getItem('user')

  // ✅ Derive admin status from the user object stored at login
  // — not a separate 'isAdmin' key that was never being set.
  // Your login API response should return: { token, user: { role: 'admin', ... } }
  let isAdmin = false
  if (token && userRaw) {
    try {
      const user = JSON.parse(userRaw)
      // Support both role-based and explicit isAdmin flag from backend
      isAdmin = user?.role === 'admin' || user?.isAdmin === true
    } catch {
      isAdmin = false
    }
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute