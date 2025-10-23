'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Settings, Plus, Trophy, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { useState, useEffect } from 'react'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
}

export function BottomNavigation() {
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
          // ignore
        }
      }

      fetchCount()

      return () => { mounted = false }
    } else {
      setNotificationCount(0)
    }
  }, [user])

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'book',
      label: 'Events',
      icon: Plus,
      path: '/book'
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      path: '/bookings'
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      path: '/leaderboard'
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: Bell,
      path: '/notifications',
      badge: notificationCount
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/profile'
    }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || 
            (item.path === '/dashboard' && (pathname === '/' || pathname.startsWith('/dashboard'))) ||
            (item.path === '/leaderboard' && pathname === '/leaderboard')
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors relative min-w-0",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("h-4 w-4 mb-1", isActive && "text-blue-600")} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-blue-600" : "text-gray-500"
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

export function withBottomNavigation(Component: React.ComponentType) {
  return function WrappedComponent(props: any) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        <Component {...props} />
        <BottomNavigation />
      </div>
    )
  }
}
