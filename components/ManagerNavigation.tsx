'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, QrCode, Users, BarChart3, Settings, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { getUnreadNotificationCount } from '@/lib/localStorage'

export function ManagerNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (user?.id) {
      const count = getUnreadNotificationCount(user.id)
      setNotificationCount(count)
    }
  }, [user])

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      path: '/manager/dashboard',
      icon: Home
    },
    {
      id: 'scanner',
      label: 'Scanner',
      path: '/dedicated-scanner',
      icon: QrCode
    },
    {
      id: 'monitor',
      label: 'Status',
      path: '/manager/monitor',
      icon: Users
    },
    {
      id: 'notifications',
      label: 'Alerts',
      path: '/notifications',
      icon: Bell,
      badge: notificationCount
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/manager/reports',
      icon: BarChart3
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/manager/settings',
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
            (item.path === '/manager/dashboard' && (pathname === '/' || pathname.startsWith('/dashboard'))) ||
            (item.path === '/dedicated-scanner' && pathname === '/scanner') // Also highlight for old scanner path
          
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
