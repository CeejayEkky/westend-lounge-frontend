import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Save, X, Upload, AlertTriangle } from 'lucide-react'
import { supabase } from '../../config/supabaseClient'
import api from '../../utils/api'
import toast from 'react-hot-toast'

// Confirm Modal Component
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full text-center"
    >
      <AlertTriangle className="w-10 h-10 text-westend-gold mx-auto mb-3" />
      <p className="text-lg font-semibold mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={onCancel} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">Cancel</button>
        <button onClick={onConfirm} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Delete</button>
      </div>
    </motion.div>
  </motion.div>
)

const MenuEditor = () => {
  const [menuItems, setMenuItems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'grills',
    description: '',
    image_url: '',
    popular: false,
    spicy: false,
    available: true
  })

  const categories = ['grills', 'appetizers', 'main', 'drinks', 'cocktails', 'desserts']

  const resetForm = () => {
    setFormData({
      name: '', price: '', category: 'grills', description: '',
      image_url: '', popular: false, spicy: false, available: true
    })
    setIsEditing(false)
    setShowAddForm(false)
    setEditingItem(null)
  }

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu')
      setMenuItems(response.data.data)
    } catch (error) {
      toast.error('Failed to load menu')
    }
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

  // ✅ CLOUDINARY IMAGE UPLOAD
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'westend_lounge') // The preset you created
      
      // Your Cloudinary cloud name - REPLACE WITH YOUR ACTUAL CLOUD NAME
      const CLOUD_NAME = 'dzg4zxrkb' // e.g., 'dg8kqxr1m'
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      
      const data = await response.json()
      
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, image_url: data.secure_url }))
        toast.success('Image uploaded successfully! 🎉')
        console.log('Image URL:', data.secure_url)
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
  if (!formData.name || !formData.price) {
    toast.error('Name and price are required')
    return
  }
  try {
    console.log('📦 Saving item with image_url:', formData.image_url) // ✅ Debug log
    
    if (editingItem) {
      const response = await api.put(`/menu/${editingItem.id}`, formData)
      if (response.data.success) {
        toast.success('Item updated')
        fetchMenuItems()
        resetForm()
      }
    } else {
      const response = await api.post('/menu', formData)
      if (response.data.success) {
        toast.success('Item added')
        fetchMenuItems()
        resetForm()
      }
    }
  } catch (error) {
    console.error('Save error:', error)
    toast.error('Failed to save')
  }
}

  const handleDeleteRequest = (id) => {
    setConfirmDelete(id)
  }

  const handleDeleteConfirmed = async () => {
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      await api.delete(`/menu/${id}`)
      toast.success('Item deleted')
      fetchMenuItems()
    } catch (error) {
      toast.error('Delete failed')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image_url: item.image_url || '',
      popular: item.popular,
      spicy: item.spicy,
      available: item.available
    })
    setIsEditing(true)
    setShowAddForm(true)
  }

  return (
    <>
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            message="Delete this menu item? This cannot be undone."
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      <div className="bg-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Menu Editor</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-westend-gold text-westend-dark px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-westend-amber transition"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 rounded-xl p-6 mb-6"
            >
              <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Item Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-westend-gold focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Price in ₦ *"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || '' })}
                  className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-westend-gold focus:outline-none"
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-4 py-2 bg-gray-600 rounded-lg border border-white/10 focus:border-westend-gold focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-westend-gold focus:outline-none"
                  rows="2"
                />

                {/* Cloudinary Image Upload */}
                <div className="col-span-2">
                  <label className="block mb-2 text-sm">Item Image</label>
                  <div className="flex gap-4 items-center">
                    <button
                      type="button"
                      onClick={() => document.getElementById('imageUpload').click()}
                      className="px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2 hover:bg-white/20 transition"
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Image to Cloudinary'}
                    </button>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {formData.image_url && (
                      <div className="flex items-center gap-2">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, GIF (max 5MB)</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  />
                  <span>Popular Item</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.spicy}
                    onChange={(e) => setFormData({ ...formData, spicy: e.target.checked })}
                  />
                  <span>Spicy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                  <span>Available</span>
                </label>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={resetForm}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Items List */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{item.name}</h3>
                  <p className="text-sm text-white/60 truncate">
                    {item.description?.substring(0, 50)}
                  </p>
                </div>
                <span className="text-xs bg-westend-gold/20 text-westend-gold px-2 py-1 rounded-full shrink-0">
                  {item.category}
                </span>
                {item.popular && (
                  <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full shrink-0">
                    Popular
                  </span>
                )}
                {!item.available && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full shrink-0">
                    Unavailable
                  </span>
                )}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xl font-bold text-westend-gold">
                  ₦{Number(item.price).toLocaleString()}
                </p>
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {menuItems.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No menu items yet. Click "Add Item" to get started.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MenuEditor