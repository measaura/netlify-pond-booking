'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { AdminNavigation } from '@/components/AdminNavigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { ArrowLeft, Bell, AlertTriangle, Trophy, Calendar, Settings, CheckCircle, Trash2, Check, RefreshCw, Info } from "lucide-react"
import Link from "next/link"
import { useAuth } from '@/lib/auth'
// API-backed helpers (server derives user from session)
async function fetchNotifications() {
  const res = await fetch(`/api/notifications/list?unread=false`)
  if (!res.ok) throw new Error('Failed to load')
  const json = await res.json()
  return json.notifications
}

async function fetchUnreadCount() {
  const res = await fetch(`/api/notifications/unread`)
  if (!res.ok) return 0
  const json = await res.json()
  return json.count || 0
}

async function apiMarkAsRead(notificationId: number) {
  const res = await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: notificationId }),
  })
  if (!res.ok) throw new Error('Failed to mark read')
  return await res.json()
}

async function apiDeleteNotification(notificationId: number) {
  const res = await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
  return await res.json()
}

async function apiMarkAllRead() {
  const res = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to mark all')
  return await res.json()
}
import type { Notification } from '@/types'

// Custom event for notification updates
const NOTIFICATION_UPDATE_EVENT = 'notificationUpdate'

// Function to trigger notification update event
const triggerNotificationUpdate = () => {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATE_EVENT))
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      if (user?.id) {
        const userNotifications = await fetchNotifications()
        setNotifications(userNotifications)
        const count = await fetchUnreadCount()
        setUnreadCount(count)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  const refreshNotifications = () => {
    loadNotifications()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar
      case 'system': return Settings
      case 'alert': return AlertTriangle
      case 'achievement': return Trophy
      case 'maintenance': return AlertTriangle
      case 'promotion': return Info
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await apiMarkAsRead(notificationId)
      await loadNotifications()
      triggerNotificationUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (notificationId: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    try {
      await apiDeleteNotification(notificationId)
      await loadNotifications()
      triggerNotificationUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      await apiMarkAllRead()
      await loadNotifications()
      triggerNotificationUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateTestNotification = async () => {
    if (!user?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: 'system', title: 'System Alert', message: 'This is a test admin notification created at ' + new Date().toLocaleTimeString(), priority: 'high' })
      })
      await loadNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Determine styling and navigation based on role
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const isUser = user?.role === 'user'

  const getBackgroundClasses = () => {
    if (isAdmin) return 'min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20'
    if (isManager) return 'min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20'
    return 'min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20'
  }

  const getIconColor = () => {
    if (isAdmin) return 'text-red-600'
    return 'text-blue-600'
  }

  const getUnreadIndicatorColor = () => {
    if (isAdmin) return 'bg-red-500'
    return 'bg-blue-500'
  }

  const getUnreadCardClasses = (isRead: boolean) => {
    if (!isRead) {
      if (isAdmin) return 'bg-red-50 border-red-200'
      return 'bg-blue-50 border-blue-200'
    }
    return ''
  }

  const getDefaultDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard'
    if (isManager) return '/manager/dashboard'
    return '/dashboard'
  }

  const NavigationComponent = () => {
    if (isAdmin) return <AdminNavigation />
    if (isManager) return <ManagerNavigation />
    return <BottomNavigation />
  }

  return (
    <AuthGuard>
      <div className={getBackgroundClasses()}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={getDefaultDashboardPath()}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Bell className={`h-6 w-6 ${getIconColor()}`} />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {isAdmin ? 'Admin Alerts' : 'Notifications'}
                    </h1>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={refreshNotifications} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Admin Controls - Only show for admin users */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleCreateTestNotification}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Create Test Notification
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Send System Alert
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  disabled
                >
                  <Info className="h-4 w-4 mr-2" />
                  Broadcast Message
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You&apos;re all caught up! Check back later for new notifications.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const IconComponent = getTypeIcon(notification.type)
                return (
                  <Card 
                    key={notification.id} 
                    className={`
                      ${getUnreadCardClasses(!notification.isRead)}
                      ${getPriorityColor(notification.priority)} 
                      hover:shadow-md transition-shadow cursor-pointer
                    `}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id)
                      }
                      router.push(`/notifications/${notification.id}`)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-full 
                          ${notification.priority === 'high' ? 'bg-red-100' : 
                            notification.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'}
                        `}>
                          <IconComponent className={`
                            h-4 w-4 
                            ${notification.priority === 'high' ? 'text-red-600' : 
                              notification.priority === 'medium' ? 'text-orange-600' : 'text-blue-600'}
                          `} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <div className={`w-2 h-2 ${getUnreadIndicatorColor()} rounded-full`}></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs capitalize ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.type}
                            </Badge>
                            <div className="flex gap-1">
                              {!notification.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(notification.id)
                                }}
                                className={`h-6 w-6 p-0 ${isAdmin ? 'text-red-600 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* System Status Alerts - Only show for admin users */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database Health</span>
                  <Badge className="bg-green-100 text-green-800">Good</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking System</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">User Sessions</span>
                  <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">QR Scanner</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <NavigationComponent />
      </div>
    </AuthGuard>
  )
}
