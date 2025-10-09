'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, hasPermission, hasRole } from '@/lib/auth'
import type { User } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'manager' | 'admin'
  requiredPermission?: string
  fallbackPath?: string
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser()
      console.log('=== AUTHGUARD DEBUG ===')
      console.log('AuthGuard checking user:', currentUser)
      
      if (!currentUser) {
        // Not authenticated, redirect to login
        console.log('No user found, redirecting to login')
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      // Check role requirements
      if (requiredRole && !hasRole(requiredRole)) {
        // Insufficient role, redirect based on user's actual role
        console.log('Insufficient role, redirecting')
        if (currentUser.role === 'user') {
          router.push('/dashboard')
        } else if (currentUser.role === 'manager') {
          router.push('/admin')
        } else {
          router.push('/admin')
        }
        return
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission)) {
        console.log('Insufficient permissions, redirecting')
        router.push(fallbackPath)
        return
      }

      console.log('Auth check passed, setting user:', currentUser.name, currentUser.id)
      setUser(currentUser)
      setLoading(false)
      console.log('=== END AUTHGUARD DEBUG ===')
    }

    // Initial check
    checkAuth()

    // Listen for auth state changes
    const handleAuthChange = () => {
      console.log('AuthGuard received auth state change event')
      checkAuth()
    }

    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [router, pathname, requiredRole, requiredPermission, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return <>{children}</>
}
