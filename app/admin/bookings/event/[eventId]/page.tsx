'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Users, Calendar, DollarSign, Clock, MapPin, Trash2, RefreshCw, BarChart3, Award } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { } from '@/lib/localStorage'
import type { Event, BookingData } from '@/types'

export default function AdminEventBookingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<(Event & { participants: number }) | null>(null)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const eventId = parseInt(params.eventId as string)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const eventsRes = await fetch('/api/events')
      const eventsJson = await eventsRes.json()
      const eventData = eventsJson.find((e: any) => e.id === eventId) ?? null

      const bookingsRes = await fetch(`/api/bookings?eventId=${eventId}`)
      const bookingsJson = await bookingsRes.json()
      const eventBookings = bookingsJson && bookingsJson.ok ? bookingsJson.data : []

      setEvent(eventData)
      setBookings(eventBookings)
    } catch (error) {
      console.error('Error loading event bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return
    try {
      const res = await fetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await loadData()
    } catch (err) {
      console.error('Failed to delete booking', err)
      alert('Failed to delete booking')
    }
  }

  const refreshData = () => {
    loadData()
  }

  // Calculate statistics
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0
  const uniqueCustomers = new Set(bookings.map(b => b.userId)).size

  if (isLoading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-red-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading event data...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!event) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-500 mb-4">The requested event could not be found.</p>
            <Button onClick={() => router.push('/admin/status')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Status
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/status')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
                    <p className="text-xs text-gray-500">Admin Management</p>
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
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{event.maxParticipants}</div>
                  <div className="text-sm text-gray-600">Max Participants</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">${event.entryFee}</div>
                  <div className="text-sm text-gray-600">Entry Fee</div>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t">
                {/* <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prize</span>
                  <span className="font-semibold text-gray-900">{event.prize}</span>
                </div> */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time</span>
                  <span className="font-semibold text-gray-900">
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Location</span>
                  <span className="font-semibold text-gray-900">{event.assignedPonds.join(', ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={
                    event.status === 'open' ? "bg-green-100 text-green-800" :
                    event.status === 'closed' ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>
                    {event.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Registration Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{bookings.length}</div>
                  <div className="text-xs text-gray-600">Registrations</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">${totalRevenue.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{uniqueCustomers}</div>
                  <div className="text-xs text-gray-600">Participants</div>
                </div>
              </div>
              
              <div className="pt-3 border-t mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capacity Used</span>
                  <span className="font-semibold text-gray-900">
                    {bookings.length}/{event.maxParticipants} ({Math.round((bookings.length / event.maxParticipants) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Registration Value</span>
                  <span className="font-semibold text-gray-900">${avgBookingValue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registrations List */}
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Registrations</h3>
                <p className="text-gray-500">No participants have registered for this event yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registered Participants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookings
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map(booking => (
                    <div key={booking.bookingId} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{booking.userName}</h4>
                          <p className="text-sm text-gray-600">{booking.userEmail}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Registered
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Seats: {booking.seats.map(s => `${s.row}${s.number}`).join(', ')}</span>
                          <span>Fee: ${booking.totalPrice}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBooking(booking.bookingId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Registered: {new Date(booking.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
