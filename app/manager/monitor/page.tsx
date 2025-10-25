'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Users, MapPin, Calendar, Trophy, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { 
  fetchPonds,
  fetchAllBookings,
  fetchEvents
} from "../../../lib/client-fetches"
import { formatDate } from '@/lib/utils'
import type { BookingData } from '@/types'

export default function ManagerStatusPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [ponds, setPonds] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshData = async () => {
    try {
      const [pondsRes, bookingsRes, eventsRes] = await Promise.all([
        fetchPonds(),
        fetchAllBookings(),
        fetchEvents()
      ])

      setPonds(pondsRes ?? [])
      setBookings(bookingsRes ?? [])
      setEvents(eventsRes ?? [])
      setLastUpdated(new Date())
    } catch (e) {
      console.error('refreshData error', e)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Group bookings by pond
  const getPondBookings = (pondId: number) => {
    return bookings.filter(booking => booking.pond.id === pondId && booking.type === 'pond')
  }

  // Group bookings by event
  const getEventBookings = (eventId: number) => {
    return bookings.filter(booking => booking.event?.id === eventId && booking.type === 'event')
  }

  // Get upcoming bookings (today and future)
  const getUpcomingBookings = (bookingsList: BookingData[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingsList.filter(booking => new Date(booking.date) >= today)
  }

  // Get today's bookings
  const getTodayBookings = (bookingsList: BookingData[]) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return bookingsList.filter(booking => booking.date === todayStr)
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
                  <h1 className="text-lg font-bold text-gray-900">Booking Status</h1>
                  <p className="text-xs text-gray-500">
                    Overview of pond & event bookings • {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">{bookings.length}</div>
                <div className="text-xs text-gray-600">Total Bookings</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {getTodayBookings(bookings).length}
                </div>
                <div className="text-xs text-gray-600">Today</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900">
                  {new Set(bookings.map(b => b.userId)).size}
                </div>
                <div className="text-xs text-gray-600">Customers</div>
              </CardContent>
            </Card>
          </div>

          {/* Pond Bookings Summary */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pond Bookings
            </h2>
            <div className="space-y-3">
              {ponds.map((pond) => {
                const pondBookings = getPondBookings(pond.id)
                const upcomingBookings = getUpcomingBookings(pondBookings)
                const todayBookings = getTodayBookings(pondBookings)
                
                return (
                  <Card 
                    key={pond.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/manager/bookings/pond/${pond.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{pond.image}</div>
                          <div>
                            <div className="font-medium text-gray-900">{pond.name}</div>
                            <div className="text-sm text-gray-600">
                              {pondBookings.length} total • {upcomingBookings.length} upcoming
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {todayBookings.length > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {todayBookings.length} today
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {upcomingBookings.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Next booking:</div>
                          <div className="text-sm">
                            {formatDate(upcomingBookings[0].date)} • {upcomingBookings[0].timeSlot.time}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Event Bookings Summary */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Event Bookings
            </h2>
            <div className="space-y-3">
              {events.map((event) => {
                const eventBookings = getEventBookings(event.id)
                const upcomingBookings = getUpcomingBookings(eventBookings)
                const todayBookings = getTodayBookings(eventBookings)
                
                return (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/manager/bookings/event/${event.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🏆</div>
                          <div>
                            <div className="font-medium text-gray-900">{event.name}</div>
                            <div className="text-sm text-gray-600">
                              {eventBookings.length} / {event.maxParticipants} participants
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {todayBookings.length > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {todayBookings.length} today
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary" 
                            className={
                              eventBookings.length >= event.maxParticipants 
                                ? "bg-red-100 text-red-800" 
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {Math.round((eventBookings.length / event.maxParticipants) * 100)}%
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Event Date:</div>
                        <div className="text-sm">
                          {formatDate(event.date)} • {event.startTime} - {event.endTime}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {/* Prize: {event.prize} • */} Entry Fee: ${event.entryFee}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((booking) => (
                    <div key={booking.bookingId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="text-lg">
                          {booking.type === 'event' ? '🏆' : booking.pond.image}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{booking.bookingId}</div>
                          <div className="text-xs text-gray-600">
                            {booking.type === 'event' ? booking.event?.name : booking.pond.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">${booking.totalPrice}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <ManagerNavigation />
      </div>
    </AuthGuard>
  )
}
