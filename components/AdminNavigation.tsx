'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Users, Bell, Settings, BarChart3, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function AdminNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const userId = user?.id
    if (userId) {
      let mounted = true
      async function fetchCount() {
        try {
          const res = await fetch(`/api/notifications/unread?userId=${userId}`)
          if (!res.ok) return
          const json = await res.json()
          if (mounted) setNotificationCount(json?.count ?? 0)
        } catch (err) {
          // ignore network errors for badge
        }
      }

      fetchCount()

      return () => { mounted = false }
    }
  }, [user])

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      path: '/admin/dashboard',
      icon: Home
    },
    {
      id: 'status',
      label: 'Status',
      path: '/admin/status',
      icon: Users
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3
    },
    {
      id: 'alerts',
      label: 'Alerts',
      path: '/notifications',
      icon: Bell,
      badge: notificationCount
    },
    {
      id: 'control',
      label: 'Control',
      path: '/admin/control',
      icon: Shield
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin/settings',
      icon: Settings
    }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || 
            (item.path === '/admin/dashboard' && (pathname === '/' || pathname.startsWith('/admin/dashboard')))
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors relative min-w-0",
                isActive 
                  ? "text-red-600 bg-red-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("h-4 w-4 mb-1", isActive && "text-red-600")} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-red-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
