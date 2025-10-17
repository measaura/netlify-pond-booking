'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Fish, Users, Calendar, DollarSign, Clock, MapPin, Trash2, RefreshCw, BarChart3, TrendingUp } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { AdminNavigation } from '@/components/AdminNavigation'
import { useAuth } from '@/lib/auth'
import { } from '@/lib/localStorage'
import type { Pond, BookingData } from '@/types'

export default function AdminPondBookingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [pond, setPond] = useState<Pond | null>(null)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const pondId = parseInt(params.pondId as string)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const pondsRes = await fetch('/api/ponds')
      const pondsJson = await pondsRes.json()
      const pondData = pondsJson.find((p: any) => p.id === pondId) ?? null

      const bookingsRes = await fetch(`/api/bookings?pondId=${pondId}`)
      const bookingsJson = await bookingsRes.json()
      const pondBookings = bookingsJson && bookingsJson.ok ? bookingsJson.data : []

      setPond(pondData)
      setBookings(pondBookings)
    } catch (error) {
      console.error('Error loading pond bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pondId])

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

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const date = new Date(booking.date).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(booking)
    return acc
  }, {} as Record<string, BookingData[]>)

  if (isLoading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-red-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading pond data...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!pond) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <Fish className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pond Not Found</h3>
            <p className="text-gray-500 mb-4">The requested pond could not be found.</p>
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
                  <Fish className="h-6 w-6 text-red-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{pond.name}</h1>
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
          {/* Pond Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Pond Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{pond.capacity}</div>
                  <div className="text-sm text-gray-600">Capacity</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">${pond.price}</div>
                  <div className="text-sm text-gray-600">Per Session</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-gray-600">Booking Status</span>
                <Badge className={pond.bookingEnabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {pond.bookingEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{bookings.length}</div>
                  <div className="text-xs text-gray-600">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">${totalRevenue.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{uniqueCustomers}</div>
                  <div className="text-xs text-gray-600">Customers</div>
                </div>
              </div>
              
              <div className="pt-3 border-t mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Booking Value</span>
                  <span className="font-semibold text-gray-900">${avgBookingValue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings</h3>
                <p className="text-gray-500">This pond has no bookings yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(bookingsByDate)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateBookings]) => (
                  <Card key={date}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dateBookings.map(booking => (
                        <div key={booking.bookingId} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{booking.userName}</h4>
                              <p className="text-sm text-gray-600">{booking.userEmail}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {booking.timeSlot.time}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Seats: {booking.seats.map(s => `${s.row}${s.number}`).join(', ')}</span>
                              <span>${booking.totalPrice}</span>
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
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        <AdminNavigation />
      </div>
    </AuthGuard>
  )
}
