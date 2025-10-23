'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Fish, Calendar, DollarSign, AlertTriangle, TrendingUp, RefreshCw, Shield, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { getAvatarUrl, getAvatarFallbackColor, getInitials } from '@/lib/avatars'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalUsers: 0,
    pondsActive: 0,
    eventsActive: 0,
    checkInsToday: 0,
    totalPonds: 0,
    totalEvents: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      // Fetch all bookings from admin endpoint
      const bookingsRes = await fetch('/api/admin/bookings', { credentials: 'include' })
      const bookingsText = await bookingsRes.text()
      const bookingsJson = bookingsText ? JSON.parse(bookingsText) : { ok: false, data: [] }
      const bookings = bookingsJson.ok && Array.isArray(bookingsJson.data) ? bookingsJson.data : []

      // Fetch ponds from DB
      const pondsRes = await fetch('/api/ponds')
      const pondsText = await pondsRes.text()
      const pondsJson = pondsText ? JSON.parse(pondsText) : { ok: false, data: [] }
      const ponds = pondsJson.ok && Array.isArray(pondsJson.data) ? pondsJson.data : []

      // Fetch events from DB
      const eventsRes = await fetch('/api/events')
      const eventsText = await eventsRes.text()
      const eventsJson = eventsText ? JSON.parse(eventsText) : { ok: false, data: [] }
      const events = eventsJson.ok && Array.isArray(eventsJson.data) ? eventsJson.data : []

      // Note: /api/checkins only supports POST (check-in action), not GET (listing)
      // For now, we'll set check-ins to empty array until a GET endpoint is created
      const todayCheckIns: any[] = []

      // Calculate today's bookings
      const todayDate = new Date().toDateString()
      const todayBookings = bookings.filter((booking: any) => 
        new Date(booking.date).toDateString() === todayDate
      )

      // Calculate total revenue
      const totalRevenue = bookings.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0)

      // Calculate active users (users with bookings in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentBookings = bookings.filter((booking: any) => 
        new Date(booking.date) >= thirtyDaysAgo
      )
      const activeUserIds = new Set(recentBookings.map((b: any) => b.bookedByUserId))

      // Count total unique users from all bookings
      const allUserIds = new Set(bookings.map((b: any) => b.bookedByUserId))

      setStats({
        totalBookings: bookings.length,
        todayBookings: todayBookings.length,
        totalRevenue,
        activeUsers: activeUserIds.size,
        totalUsers: allUserIds.size,
        pondsActive: ponds.filter((p: any) => p.bookingEnabled).length,
        eventsActive: events.filter((e: any) => e.status === 'OPEN' || e.status === 'open').length,
        checkInsToday: todayCheckIns.length,
        totalPonds: ponds.length,
        totalEvents: events.length
      })
    } catch (error) {
      console.error('Error loading admin stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const refreshData = () => {
    loadStats()
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-xs text-gray-500">System Overview</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Link href="/profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(user)} />
                    <AvatarFallback className={getAvatarFallbackColor(user?.role)}>{getInitials(user?.name, user?.role)}</AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <Fish className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-green-900">{stats.pondsActive}/{stats.totalPonds}</div>
                <div className="text-xs text-green-700">Ponds Active</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-xl font-bold text-blue-900">{stats.eventsActive}</div>
                <div className="text-xs text-blue-700">Events Open</div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Today&apos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.todayBookings}</div>
                  <div className="text-xs text-gray-600">New Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.checkInsToday}</div>
                  <div className="text-xs text-gray-600">Check-ins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                User Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{stats.totalUsers}</div>
                  <div className="text-xs text-gray-600">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{stats.activeUsers}</div>
                  <div className="text-xs text-gray-600">Active (30 days)</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/status">
                <Button variant="outline" className="w-full justify-start">
                  <Fish className="h-4 w-4 mr-2" />
                  View System Status
                </Button>
              </Link>
              
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </Link>

              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bookings System</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Notifications</span>
                  <Badge className="bg-green-100 text-green-800">Running</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">QR Scanner</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
