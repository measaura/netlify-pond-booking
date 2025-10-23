'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, hasPermission, hasRole } from '@/lib/auth'
import type { User } from '@/lib/auth'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  const [accessDenied, setAccessDenied] = useState(false)
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
        // Insufficient role, show access denied
        console.log('Insufficient role, showing access denied')
        setUser(currentUser)
        setAccessDenied(true)
        setLoading(false)
        return
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission)) {
        console.log('Insufficient permissions, showing access denied')
        setUser(currentUser)
        setAccessDenied(true)
        setLoading(false)
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

  if (accessDenied) {
    // Determine the correct redirect path based on user role
    const redirectPath = user.role === 'user' 
      ? '/dashboard' 
      : user.role === 'manager' 
      ? '/manager/dashboard' 
      : '/admin/dashboard'

    const requiredRoleText = requiredRole 
      ? requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)
      : 'higher'

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-6">
              This page requires <span className="font-semibold text-red-600">{requiredRoleText}</span> access.
              You are currently logged in as <span className="font-semibold">{user.role}</span>.
            </p>

            <div className="space-y-3">
              <Link href={redirectPath} className="block">
                <Button className="w-full" size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to My Dashboard
                </Button>
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                Need help? Contact an administrator to request access.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
