'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Calendar, Clock, MapPin, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { 
  getEventById,
  getAllBookings,
  deleteBooking,
} from "@/lib/localStorage"
import type { Event, BookingData } from '@/types'

interface Booking {
  id: string
  type: 'pond' | 'event'
  event: string
  date: string
  time: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  price: number
  qrCode: string
  seats: string
  instructions: string
  userName: string
  userEmail: string
  userId: string
}

export default function ManagerEventBookingsPage() {
  const params = useParams()
  const eventId = parseInt(params.eventId as string)
  
  const [event, setEvent] = useState(getEventById(eventId))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const loadEventBookings = () => {
    setLoading(true)
    try {
      const allBookings = getAllBookings()
      const eventBookings = allBookings.filter(booking => 
        booking.event?.id === eventId && booking.type === 'event'
      )

      // Transform to match Booking interface
      const transformedBookings: Booking[] = eventBookings.map((dbBooking: BookingData) => {
        const bookingDate = new Date(dbBooking.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let status: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming'
        if (bookingDate < today) {
          status = 'completed'
        } else if (bookingDate.toDateString() === today.toDateString()) {
          status = 'active'
        }

        const seatLabels = dbBooking.seats.map(seat => `${seat.row}${seat.number}`).join(', ')

        return {
          id: dbBooking.bookingId,
          type: dbBooking.type,
          event: dbBooking.event?.name || 'Event',
          date: dbBooking.date,
          time: dbBooking.timeSlot?.time || 'Time TBD',
          status,
          price: dbBooking.totalPrice,
          qrCode: dbBooking.bookingId.slice(-6).toUpperCase(),
          seats: seatLabels,
          instructions: 'Check event details and arrive 30 minutes early.',
          userName: dbBooking.userName,
          userEmail: dbBooking.userEmail,
          userId: dbBooking.userId?.toString() || ''
        }
      })

      // Sort by date, ascending (nearest first)
      transformedBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setBookings(transformedBookings)
      
    } catch (error) {
      console.error('Error loading event bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventBookings()
  }, [eventId])

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      const success = deleteBooking(bookingId)
      if (success) {
        loadEventBookings()
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-600'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (!event) {
    return (
      <AuthGuard requiredRole="manager">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
          <div className="max-w-md mx-auto p-4">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Not Found</h3>
              <p className="text-gray-600 mb-4">The requested event could not be found.</p>
              <Link href="/manager/monitor">
                <Button>Back to Status</Button>
              </Link>
            </div>
          </div>
          <ManagerNavigation />
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="manager">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/manager/monitor">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{event.name}</h1>
                    <p className="text-xs text-gray-500">
                      {bookings.length} bookings • {event.date}
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadEventBookings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 text-center">
                <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{bookings.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'upcoming' || b.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 text-center">
                <User className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">
                  {new Set(bookings.map(b => b.userId)).size}
                </div>
                <div className="text-xs text-gray-600">Customers</div>
              </CardContent>
            </Card>
          </div>

          {/* Event Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                {/* <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{event.pondName}</span>
                </div> */}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                {/* <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prize:</span>
                  <span className="font-medium text-green-600">{event.prize}</span>
                </div> */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entry Fee:</span>
                  <span className="font-medium">${event.entryFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Participants:</span>
                  <span>{event.maxParticipants}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600">This event has no bookings.</p>
              </div>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {booking.id}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{booking.userName}</span>
                            <span className="text-gray-400">•</span>
                            <span>{booking.userEmail}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(booking.date).toLocaleDateString()}</span>
                            <span className="text-gray-400">•</span>
                            <Clock className="h-3 w-3" />
                            <span>{booking.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>Seats: {booking.seats}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium text-green-600">${booking.price}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <ManagerNavigation />
      </div>
    </AuthGuard>
  )
}
