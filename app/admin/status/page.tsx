'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Fish, Calendar, Users, DollarSign, Clock, MapPin, RefreshCw, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { 
  getAllBookings,
  getPonds,
  getEvents,
  getTodayCheckIns,
  getCheckInStats
} from '@/lib/localStorage'
import type {
  BookingData,
  Pond,
  Event
} from '@/types'

export default function AdminStatusPage() {
  const { user } = useAuth()
  const [ponds, setPonds] = useState<Pond[]>([])
  const [events, setEvents] = useState<(Event & { participants: number })[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [checkInStats, setCheckInStats] = useState<{
    totalToday: number
    currentlyCheckedIn: number
    totalCheckOuts: number
    noShows: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStatusData = () => {
    setIsLoading(true)
    try {
      const allPonds = getPonds()
      const allEvents = getEvents()
      const allBookings = getAllBookings()
      const stats = getCheckInStats()
      
      setPonds(allPonds)
      setEvents(allEvents)
      setBookings(allBookings)
      setCheckInStats(stats)
    } catch (error) {
      console.error('Error loading admin status data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStatusData()
  }, [])

  const refreshData = () => {
    loadStatusData()
  }

  // Calculate pond statistics
  const pondStats = ponds.map(pond => {
    const pondBookings = bookings.filter(b => b.type === 'pond' && b.pond.id === pond.id)
    const todayBookings = pondBookings.filter(b => 
      new Date(b.date).toDateString() === new Date().toDateString()
    )
    const revenue = pondBookings.reduce((sum, b) => sum + b.totalPrice, 0)
    
    return {
      ...pond,
      totalBookings: pondBookings.length,
      todayBookings: todayBookings.length,
      revenue,
      utilization: pond.capacity > 0 ? Math.round((todayBookings.length / pond.capacity) * 100) : 0
    }
  })

  // Calculate event statistics  
  const eventStats = events.map(event => {
    const eventBookings = bookings.filter(b => b.type === 'event' && b.event?.id === event.id)
    const revenue = eventBookings.reduce((sum, b) => sum + b.totalPrice, 0)
    
    return {
      ...event,
      totalBookings: eventBookings.length,
      revenue
    }
  })

  // System overview stats
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
  const todayBookings = bookings.filter(b => 
    new Date(b.date).toDateString() === new Date().toDateString()
  ).length
  const activeUsers = new Set(bookings.map(b => b.userId)).size

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">System Status</h1>
                    <p className="text-xs text-gray-500">Real-time Operations</p>
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
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{todayBookings}</div>
                  <div className="text-xs text-gray-600">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">${totalRevenue.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{activeUsers}</div>
                  <div className="text-xs text-gray-600">Active Users</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pond Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Fish className="h-5 w-5" />
                Pond Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pondStats.map(pond => (
                <div key={pond.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{pond.name}</h3>
                    <Badge className={pond.bookingEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {pond.bookingEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{pond.todayBookings}</div>
                      <div className="text-xs text-gray-500">Today</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{pond.totalBookings}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">${pond.revenue}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{pond.utilization}%</div>
                      <div className="text-xs text-gray-500">Usage</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-600">Capacity: {pond.capacity}</span>
                    <Link href={`/admin/bookings/pond/${pond.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Event Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Event Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventStats.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No events configured
                </div>
              ) : (
                eventStats.map(event => (
                  <div key={event.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <Badge className={
                        event.status === 'open' ? "bg-green-100 text-green-800" :
                        event.status === 'closed' ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }>
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{event.totalBookings}</div>
                        <div className="text-xs text-gray-500">Bookings</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">${event.revenue}</div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                      {/* <div className="text-center">
                        <div className="font-semibold text-purple-600">{event.prize || 'TBD'}</div>
                        <div className="text-xs text-gray-500">Prize</div>
                      </div> */}
                    </div>
                    
                    <div className="mt-2 pt-2 border-t">
                      <Link href={`/admin/bookings/event/${event.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
