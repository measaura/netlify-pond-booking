'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, RefreshCw, Check, Trash2, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { 
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  addNotification
} from '@/lib/localStorage'
import type { Notification } from '@/types'

export default function AdminAlertsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadNotifications = () => {
    setIsLoading(true)
    try {
      if (user?.id) {
        const userNotifications = getUserNotifications(user.id)
        setNotifications(userNotifications)
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

  const handleMarkAsRead = (notificationId: number) => {
    markNotificationAsRead(notificationId)
    loadNotifications()
  }

  const handleDelete = (notificationId: number) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteNotification(notificationId)
      loadNotifications()
    }
  }

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllNotificationsAsRead(user.id)
      loadNotifications()
    }
  }

  const handleCreateTestNotification = () => {
    if (user?.id) {
      const testNotification: Omit<Notification, 'id' | 'createdAt'> = {
        userId: user.id,
        type: 'system',
        title: 'System Alert',
        message: 'This is a test admin notification created at ' + new Date().toLocaleTimeString(),
        isRead: false,
        priority: 'high'
      }
      
      addNotification(testNotification)
      loadNotifications()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return CheckCircle
      case 'system':
        return AlertTriangle
      case 'reminder':
        return Bell
      case 'event':
        return Bell
      case 'maintenance':
        return AlertTriangle
      case 'promotion':
        return Info
      default:
        return Info
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Alerts</h1>
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
          {/* Admin Actions */}
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

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up! Check back later for new notifications.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const IconComponent = getNotificationIcon(notification.type)
                return (
                  <Card 
                    key={notification.id} 
                    className={`
                      ${!notification.isRead ? 'bg-red-50 border-red-200' : ''}
                      ${getPriorityColor(notification.priority)} 
                      hover:shadow-md transition-shadow cursor-pointer
                    `}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.id)
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
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                                    handleMarkAsRead(notification.id)
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
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
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

          {/* System Status Alerts */}
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
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
