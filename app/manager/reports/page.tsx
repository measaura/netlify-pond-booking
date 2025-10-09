'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Calendar, Users, TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { 
  getAllBookings,
  getTodayCheckIns,
  getCheckInStats,
  getPonds,
  getEvents,
} from "@/lib/localStorage"
import type { BookingData, CheckInRecord } from '@/types'

export default function ManagerReportsPage() {
  const [allBookings, setAllBookings] = useState<BookingData[]>([])
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInRecord[]>([])
  const [stats, setStats] = useState(getCheckInStats())
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    setAllBookings(getAllBookings())
    setTodayCheckIns(getTodayCheckIns())
    setStats(getCheckInStats())
  }, [])

  // Calculate revenue and statistics
  const totalRevenue = allBookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
  const todayRevenue = allBookings
    .filter(booking => {
      const bookingDate = new Date(booking.date).toDateString()
      const today = new Date().toDateString()
      return bookingDate === today
    })
    .reduce((sum, booking) => sum + booking.totalPrice, 0)

  // Pond popularity
  const pondStats = getPonds().map(pond => {
    const pondBookings = allBookings.filter(booking => booking.pond.id === pond.id)
    const pondRevenue = pondBookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
    return {
      ...pond,
      bookings: pondBookings.length,
      revenue: pondRevenue
    }
  }).sort((a, b) => b.bookings - a.bookings)

  // Time slot popularity
  const timeSlotStats: { [key: string]: { count: number; revenue: number } } = {}
  allBookings.forEach(booking => {
    const timeSlot = booking.timeSlot.time
    if (!timeSlotStats[timeSlot]) {
      timeSlotStats[timeSlot] = { count: 0, revenue: 0 }
    }
    timeSlotStats[timeSlot].count++
    timeSlotStats[timeSlot].revenue += booking.totalPrice
  })

  const popularTimeSlots = Object.entries(timeSlotStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 3)

  // Export data
  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      summary: {
        totalBookings: allBookings.length,
        totalRevenue,
        todayRevenue,
        totalCheckIns: stats.totalToday,
        currentlyActive: stats.currentlyCheckedIn,
        completedSessions: stats.totalCheckOuts,
        noShows: stats.noShows
      },
      pondPerformance: pondStats,
      timeSlotPerformance: timeSlotStats,
      recentBookings: allBookings.slice(-10),
      todayActivity: todayCheckIns
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manager-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/manager/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Reports</h1>
                  <p className="text-xs text-gray-500">Business analytics & insights</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={exportReport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Period Selection */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <Button
                    key={period}
                    size="sm"
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    onClick={() => setSelectedPeriod(period)}
                    className="flex-1 capitalize"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${todayRevenue}</div>
                  <div className="text-sm text-gray-600">Today&apos;s Revenue</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${totalRevenue}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-bold">{allBookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Booking Value</span>
                  <span className="font-bold">
                    ${allBookings.length > 0 ? (totalRevenue / allBookings.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Show-up Rate</span>
                  <span className="font-bold">
                    {stats.totalToday > 0 
                      ? `${Math.round(((stats.totalToday - stats.noShows) / stats.totalToday) * 100)}%`
                      : '100%'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-bold">
                    {stats.totalToday > 0 
                      ? `${Math.round((stats.totalCheckOuts / stats.totalToday) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pond Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Pond Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pondStats.map((pond, index) => (
                  <div key={pond.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">{pond.image}</div>
                      <div>
                        <div className="font-medium">{pond.name}</div>
                        <div className="text-sm text-gray-600">
                          {pond.bookings} bookings • ${pond.revenue} revenue
                        </div>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Time Slots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Popular Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularTimeSlots.map(([timeSlot, data], index) => (
                  <div key={timeSlot} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{timeSlot}</div>
                      <div className="text-sm text-gray-600">
                        {data.count} bookings • ${data.revenue} revenue
                      </div>
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Today&apos;s Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-xl font-bold text-indigo-600">{stats.currentlyCheckedIn}</div>
                  <div className="text-xs text-gray-600">Currently Active</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats.totalCheckOuts}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{stats.totalToday}</div>
                  <div className="text-xs text-gray-600">Total Check-ins</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{stats.noShows}</div>
                  <div className="text-xs text-gray-600">No-shows</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ManagerNavigation />
      </div>
    </AuthGuard>
  )
}
