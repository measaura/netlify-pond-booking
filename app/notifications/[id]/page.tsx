'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, AlertTriangle, Trophy, Calendar, Settings, CheckCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from '@/lib/auth'
import { getUserNotifications, markNotificationAsRead } from '@/lib/localStorage'
import type { Notification } from '@/types'

export default function NotificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)

  const notificationId = parseInt(params.id as string)

  useEffect(() => {
    if (user?.id && notificationId) {
      const userNotifications = getUserNotifications(user.id)
      const foundNotification = userNotifications.find(n => n.id === notificationId)
      
      if (foundNotification) {
        setNotification(foundNotification)
        
        // Mark as read if not already read
        if (!foundNotification.isRead) {
          markNotificationAsRead(notificationId)
          // Trigger notification update event
          window.dispatchEvent(new CustomEvent('notificationUpdate'))
        }
      } else {
        // Notification not found or doesn't belong to user
        router.push('/notifications')
      }
      
      setLoading(false)
    }
  }, [user, notificationId, router])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return Calendar
      case 'event': return Trophy
      case 'maintenance': return Settings
      case 'system': return Bell
      case 'promotion': return Bell
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const NavigationComponent = user?.role === 'manager' || user?.role === 'admin' ? ManagerNavigation : BottomNavigation

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthGuard>
    )
  }

  if (!notification) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
          <div className="bg-white shadow-sm border-b">
            <div className="flex items-center gap-3 p-4">
              <Link href="/notifications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Notification</h1>
            </div>
          </div>
          
          <div className="p-4">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Not Found</h3>
                <p className="text-gray-500 mb-4">The notification you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
                <Link href="/notifications">
                  <Button>Back to Notifications</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <NavigationComponent />
        </div>
      </AuthGuard>
    )
  }

  const IconComponent = getTypeIcon(notification.type)
  const dateTime = formatDateTime(notification.createdAt)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center gap-3 p-4">
            <Link href="/notifications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`p-2 rounded-full ${
                notification.priority === 'high' ? 'bg-red-100' : 
                notification.priority === 'medium' ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                <IconComponent className={`h-5 w-5 ${getPriorityTextColor(notification.priority)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 truncate">{notification.title}</h1>
                <p className="text-sm text-gray-500 capitalize">{notification.type} notification</p>
              </div>
            </div>
            <Badge className={getPriorityColor(notification.priority)}>
              {notification.priority.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Main Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed">{notification.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {notification.message}
                  </p>
                </div>
                
                {/* Action Button and Timestamp */}
                {notification.actionUrl && (
                  <div className="pt-4 border-t">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <Link href={notification.actionUrl}>
                        <Button className="w-full sm:w-auto">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Related Content
                        </Button>
                      </Link>
                      <span className="text-xs text-gray-400 text-right">
                        {dateTime.date} at {dateTime.time}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Timestamp when no action button */}
                {!notification.actionUrl && (
                  <div className="pt-4 border-t">
                    <div className="text-right">
                      <span className="text-xs text-gray-400">
                        {dateTime.date} at {dateTime.time}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <NavigationComponent />
      </div>
    </AuthGuard>
  )
}
