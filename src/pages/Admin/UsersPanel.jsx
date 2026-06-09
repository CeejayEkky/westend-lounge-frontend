import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUsers, FiTrash2, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const UsersPanel = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      console.log('📦 Fetched users:', response.data)
      if (response.data.success) {
        setUsers(response.data.data)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleAdminRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin'
    
    console.log('🔄 Toggling role:', { userId, currentRole, newRole })
    
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole })
      console.log('📦 Role update response:', response.data)
      
      if (response.data.success) {
        toast.success(`User role updated to ${newRole}`)
        fetchUsers() // Refresh the list
      } else {
        toast.error(response.data.message || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(error.response?.data?.message || 'Failed to update user role')
    }
  }

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        const response = await api.delete(`/admin/users/${userId}`)
        if (response.data.success) {
          toast.success(`${userName} deleted successfully`)
          fetchUsers() // Refresh the list
        } else {
          toast.error(response.data.message || 'Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error(error.response?.data?.message || 'Failed to delete user')
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-westend-gold mx-auto mb-4" />
        <p className="text-gray-400">Loading users...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <FiUsers className="text-6xl text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No users found</p>
      </div>
    )
  }

  return (
    <div className="glass-effect rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <span className="text-sm text-gray-400">Total: {users.length} users</span>
      </div>
      
      <div className="space-y-3 max-h-150 overflow-y-auto pr-2">
        {users.map((user) => (
          <motion.div 
            key={user.id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-westend-gold/20 flex items-center justify-center">
                <FiUsers className="text-westend-gold" />
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-500">{user.phone || 'No phone'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' 
                  ? 'bg-westend-gold/20 text-westend-gold' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
              </span>
              
              <button 
                onClick={() => toggleAdminRole(user.id, user.role)} 
                className="p-2 text-blue-400 hover:bg-white/10 rounded-lg transition"
                title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
              >
                <FiShield size={18} />
              </button>
              
              <button 
                onClick={() => deleteUser(user.id, user.name)} 
                className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition"
                title="Delete user"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default UsersPanel