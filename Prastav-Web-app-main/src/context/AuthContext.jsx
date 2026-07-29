import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('prastav_token')
    const storedUser = localStorage.getItem('prastav_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('prastav_token')
        localStorage.removeItem('prastav_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((userData, authToken) => {
    localStorage.setItem('prastav_token', authToken)
    localStorage.setItem('prastav_user', JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('prastav_token')
    localStorage.removeItem('prastav_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    localStorage.setItem('prastav_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
