'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, DollarSign, Fish, Calendar, RefreshCw, Target, Award } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { 
  getAllBookings,
  getPonds,
  getEvents,
  getCheckInStats,
} from '@/lib/localStorage'
import type {
  BookingData,
  Pond,
  Event
} from '@/types'

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
    weeklyBookings: 0,
    monthlyBookings: 0,
    avgBookingValue: 0,
    topPerformingPond: null as any,
    peakBookingTime: '',
    userGrowth: 0,
    cancelationRate: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = () => {
    setIsLoading(true)
    try {
      const bookings = getAllBookings()
      const ponds = getPonds()
      const events = getEvents()

      // Date calculations
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Revenue calculations
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
      const weeklyBookings = bookings.filter(b => new Date(b.date) >= weekAgo)
      const monthlyBookings = bookings.filter(b => new Date(b.date) >= monthAgo)
      
      const weeklyRevenue = weeklyBookings.reduce((sum, b) => sum + b.totalPrice, 0)
      const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0)

      // Booking statistics
      const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

      // Find top performing pond
      const pondPerformance = ponds.map(pond => {
        const pondBookings = bookings.filter(b => b.type === 'pond' && b.pond.id === pond.id)
        const revenue = pondBookings.reduce((sum, b) => sum + b.totalPrice, 0)
        return {
          pond,
          bookings: pondBookings.length,
          revenue
        }
      }).sort((a, b) => b.revenue - a.revenue)

      const topPerformingPond = pondPerformance[0] || null

      // Peak booking time analysis
      const hourCounts = new Array(24).fill(0)
      bookings.forEach(booking => {
        const hour = new Date(booking.createdAt).getHours()
        hourCounts[hour]++
      })
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
      const peakBookingTime = `${peakHour}:00 - ${peakHour + 1}:00`

      // User growth (simplified - comparing last 30 days to previous 30 days)
      const uniqueUsersRecent = new Set(monthlyBookings.map(b => b.userId)).size
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      const previousMonthBookings = bookings.filter(b => {
        const date = new Date(b.date)
        return date >= twoMonthsAgo && date < monthAgo
      })
      const uniqueUsersPrevious = new Set(previousMonthBookings.map(b => b.userId)).size
      const userGrowth = uniqueUsersPrevious > 0 ? 
        ((uniqueUsersRecent - uniqueUsersPrevious) / uniqueUsersPrevious * 100) : 0

      setAnalytics({
        totalRevenue,
        weeklyRevenue,
        monthlyRevenue,
        totalBookings: bookings.length,
        weeklyBookings: weeklyBookings.length,
        monthlyBookings: monthlyBookings.length,
        avgBookingValue,
        topPerformingPond,
        peakBookingTime,
        userGrowth,
        cancelationRate: 0 // Placeholder - would need booking status tracking
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const refreshData = () => {
    loadAnalytics()
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
                  <BarChart3 className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-xs text-gray-500">Business Insights</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Revenue Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">${analytics.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-blue-600">${analytics.weeklyRevenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">Last 7 Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-purple-600">${analytics.monthlyRevenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">Last 30 Days</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Booking Value</span>
                    <span className="font-semibold text-gray-900">${analytics.avgBookingValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Booking Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.totalBookings}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">{analytics.weeklyBookings}</div>
                    <div className="text-xs text-gray-600">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-orange-600">{analytics.monthlyBookings}</div>
                    <div className="text-xs text-gray-600">This Month</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Peak Booking Time</span>
                    <span className="font-semibold text-gray-900">{analytics.peakBookingTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topPerformingPond ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Fish className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{analytics.topPerformingPond.pond.name}</h3>
                      <p className="text-sm text-gray-600">Best Performing Pond</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{analytics.topPerformingPond.bookings}</div>
                      <div className="text-xs text-gray-600">Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">${analytics.topPerformingPond.revenue.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No booking data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Growth Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">User Growth (30 days)</span>
                  <div className="flex items-center gap-1">
                    <Badge className={analytics.userGrowth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {analytics.userGrowth >= 0 ? '+' : ''}{analytics.userGrowth.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cancellation Rate</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {analytics.cancelationRate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reports & Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Revenue Report
              </Button>
              
              <Button variant="outline" className="w-full justify-start" disabled>
                <Users className="h-4 w-4 mr-2" />
                Export User Analytics
              </Button>

              <Button variant="outline" className="w-full justify-start" disabled>
                <Fish className="h-4 w-4 mr-2" />
                Export Pond Performance
              </Button>
              
              <div className="text-xs text-gray-500 text-center pt-2">
                Export functionality coming soon
              </div>
            </CardContent>
          </Card>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
