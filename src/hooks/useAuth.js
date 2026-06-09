import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUser()
    
    const handleLogin = () => loadUser()
    const handleLogout = () => setUser(null)
    
    window.addEventListener('user-login', handleLogin)
    window.addEventListener('user-logout', handleLogout)
    
    return () => {
      window.removeEventListener('user-login', handleLogin)
      window.removeEventListener('user-logout', handleLogout)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.dispatchEvent(new Event('user-logout'))
  }

  return { user, loading, logout }
}