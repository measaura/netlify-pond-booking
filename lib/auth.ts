// User Authentication and Authorization System

export interface User {
  id: number
  email: string
  password: string // In production, this should be hashed
  name: string
  role: 'user' | 'manager' | 'admin'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  profileImage?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

// Password validation rules
export const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*(),.?":{}|<>'
}

// Initialize dummy users
const initializeUsers = (): User[] => {
  const existingUsers = localStorage.getItem('users')
  
  if (existingUsers) {
    return JSON.parse(existingUsers)
  }

  const defaultUsers: User[] = [
    // 3 Users
    {
      id: 1,
      email: 'user1@fishing.com',
      password: '123456@$',
      name: 'John Doe',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      email: 'user2@fishing.com',
      password: '123456@$',
      name: 'Jane Smith',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      email: 'user3@fishing.com',
      password: '123456@$',
      name: 'Mike Johnson',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    // 2 Managers
    {
      id: 4,
      email: 'manager1@fishing.com',
      password: '123456@$',
      name: 'Sarah Manager',
      role: 'manager',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      email: 'manager2@fishing.com',
      password: '123456@$',
      name: 'David Manager',
      role: 'manager',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    // 1 Admin
    {
      id: 6,
      email: 'admin@fishing.com',
      password: '123456@$',
      name: 'Admin Smith',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]

  localStorage.setItem('users', JSON.stringify(defaultUsers))
  return defaultUsers
}

// Validate password strength
export const validatePassword = (password: string): { isValid: boolean, errors: string[] } => {
  const errors: string[] = []

  if (password.length < passwordRules.minLength) {
    errors.push(`Password must be at least ${passwordRules.minLength} characters long`)
  }

  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (passwordRules.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (passwordRules.requireSpecialChars && !new RegExp(`[${passwordRules.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Authentication functions
export const login = async (username: string, password: string): Promise<boolean> => {
  const users = initializeUsers()
  const user = users.find((u: User) => u.email === username && u.password === password)
  
  if (user) {
    // Store proper AuthState
    const authState: AuthState = {
      isAuthenticated: true,
      user: user,
      token: 'fake-jwt-token' // In a real app, this would be a proper JWT
    }
    
    localStorage.setItem('authState', JSON.stringify(authState))
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authStateChanged'))
    }
    
    return true
  }
  
  return false
}

export const register = async (userData: {
  email: string
  password: string
  name: string
  role?: 'user'
}): Promise<{ success: boolean, user?: User, error?: string }> => {
  try {
    const users = initializeUsers()
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())
    if (existingUser) {
      return { success: false, error: 'User already exists with this email' }
    }

    // Validate password
    const passwordValidation = validatePassword(userData.password)
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.errors.join(', ') }
    }

    // Create new user
    const newUser: User = {
      id: Date.now(), // Simple ID generation
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))

    return { success: true, user: { ...newUser, password: '' } }
  } catch (error) {
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

export const logout = (): void => {
  localStorage.removeItem('authState')
  
  // Dispatch custom event to notify other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authStateChanged'))
  }
}

export const getCurrentUser = (): User | null => {
  try {
    const authState = localStorage.getItem('authState')
    if (!authState) return null

    const parsed: AuthState = JSON.parse(authState)
    if (!parsed.isAuthenticated || !parsed.user) return null

    // Verify token is still valid (optional: add expiration check)
    return parsed.user
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

export const hasRole = (requiredRole: 'user' | 'manager' | 'admin'): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  const roleHierarchy = { user: 1, manager: 2, admin: 3 }
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser()
  if (!user) return false

  const permissions = {
    user: [
      'view_events',
      'book_pond',
      'view_bookings',
      'view_rankings',
      'view_profile'
    ],
    manager: [
      'view_events',
      'book_pond',
      'view_bookings',
      'view_rankings',
      'view_profile',
      'manage_ponds',
      'create_events',
      'scan_qr',
      'view_reports',
      'manage_pond_settings'
    ],
    admin: [
      'view_events',
      'book_pond',
      'view_bookings',
      'view_rankings',
      'view_profile',
      'manage_ponds',
      'create_events',
      'scan_qr',
      'view_reports',
      'manage_pond_settings',
      'manage_users',
      'manage_system',
      'view_admin_dashboard'
    ]
  }

  return permissions[user.role]?.includes(permission) || false
}

// User management functions (for admin)
export const getAllUsers = (): User[] => {
  const users = initializeUsers()
  return users.map(user => ({ ...user, password: '' })) // Don't return passwords
}

export const updateUserStatus = (userId: number, isActive: boolean): boolean => {
  try {
    const users = initializeUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) return false
    
    users[userIndex].isActive = isActive
    localStorage.setItem('users', JSON.stringify(users))
    
    return true
  } catch {
    return false
  }
}

export const updateUserRole = (userId: number, role: 'user' | 'manager' | 'admin'): boolean => {
  try {
    const users = initializeUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) return false
    
    users[userIndex].role = role
    localStorage.setItem('users', JSON.stringify(users))
    
    return true
  } catch {
    return false
  }
}

// Initialize users on module load
if (typeof window !== 'undefined') {
  initializeUsers()
}

// React hook for authentication
import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = () => {
    const authState = getCurrentUser()
    
    if (authState) {
      setUser(authState)
      setIsAuthenticated(true)
    } else {
      setUser(null)
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    // Initial check
    checkAuth()

    // Listen for storage changes (for when user logs in/out in another tab or component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authState') {
        checkAuth()
      }
    }

    // Listen for custom auth events (for same-tab login/logout)
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    hasRole,
    hasPermission
  }
}
