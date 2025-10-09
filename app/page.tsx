'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getCurrentUser } from '@/lib/auth'
import { Fish } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      if (!isAuthenticated()) {
        // Not authenticated, redirect to login
        router.push('/login')
        return
      }

      const user = getCurrentUser()
      if (user) {
        // Redirect based on user role
        if (user.role === 'admin' || user.role === 'manager') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    }

    checkAuthAndRedirect()
  }, [router])

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <Fish className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">FishComp</h1>
        <p className="text-gray-600">Loading...</p>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  )
}
