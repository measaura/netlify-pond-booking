'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ManagerNavigation } from '@/components/ManagerNavigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Fish, Calendar, Clock, MapPin, QrCode, Users, Trophy, AlertCircle, Trash2, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { fetchCurrentUserFromSession } from '@/lib/api'
import type { BookingData } from '@/types'
import { useToastSafe } from '@/components/ui/toast'

interface Booking {
  bookingId: string
  type: 'pond' | 'event'
  title: string
  location: string
  date: string
  time: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  participants?: number
  maxParticipants?: number
  price: number
  qrCode: string
  instructions?: string
  seats?: string[]
  // User information (for managers)
  userName?: string
  userEmail?: string
  userId?: string
}

function TicketCard({ booking, onDelete }: { booking: Booking; onDelete: (bookingId: string) => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isEventBooking = booking.type === 'event'

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      onDelete(booking.bookingId)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Booking Header */}
        <div className={`${isEventBooking ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-green-600'} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEventBooking ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <Fish className="h-6 w-6" />
              )}
              <div>
                <h3 className="font-bold text-lg">{booking.title}</h3>
                <div className="flex items-center gap-1 text-sm opacity-90">
                  <MapPin className="h-3 w-3" />
                  <span>{booking.location}</span>
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`${getStatusColor(booking.status)} border-0`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Booking Details */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </p>
              <p className="font-medium">{new Date(booking.date).toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </p>
              <p className="font-medium">{booking.time}</p>
            </div>
            <div>
              <p className="text-gray-600">{isEventBooking ? 'Entry Fee' : 'Session Fee'}</p>
              <p className="font-medium text-green-600">${booking.price}</p>
            </div>
            {booking.seats && booking.seats.length > 0 && (
              <div>
                <p className="text-gray-600">Seats</p>
                <p className="font-medium">{booking.seats.join(', ')}</p>
              </div>
            )}
          </div>
          
          {/* User Information (for managers) */}
          {booking.userName && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{booking.userName}</p>
                  <p className="text-gray-500">{booking.userEmail}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <div className="bg-gray-100 p-2 rounded-lg h-[40px] flex flex-col justify-center">
                  <div className="text-sm font-mono font-bold text-gray-800 leading-tight">{booking.bookingId}</div>
                  <div className="text-xs text-gray-500 leading-tight">Booking ID</div>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <Link href={`/ticket?bookingId=${booking.bookingId}&source=bookings`}>
                  <Button size="sm" className="h-[40px] flex items-center gap-2 text-sm px-3">
                    <QrCode className="h-4 w-4" />
                    Show QR
                  </Button>
                </Link>
              </div>
              <div className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDelete}
                  className="h-[40px] w-[40px] text-red-600 hover:text-red-700 hover:bg-red-50 p-0 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {booking.instructions && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-blue-900">Important Instructions</h5>
                  <p className="text-sm text-blue-700 mt-1">{booking.instructions}</p>
                </div>
              </div>
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  )
}

function BookingsContent() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToastSafe()
  
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  const loadBookings = async () => {
    try {
      // Use server API to fetch bookings. Prefer deriving userId from session (user object).
      const userIdParam = user?.id ? `userId=${encodeURIComponent(user.id)}` : ''
      const allQuery = isManager ? '' : `?${userIdParam}`
      const url = isManager ? '/api/bookings?userId=1' : `/api/bookings?${userIdParam}`
      // If manager, fetch all bookings by calling a manager endpoint or passing no filter; here fallback to userId=1 for now
  const res = await fetch(url)
  const json = await res.json()
  const allBookings: BookingData[] = Array.isArray(json.data) ? json.data : []

      if (!user && !isManager) {
        setBookings([])
        setLoading(false)
        return
      }

      // Filter bookings based on user role
      const filteredBookings = isManager
        ? allBookings // Managers see all bookings
        : allBookings.filter((booking: BookingData) => booking.userId === user?.id) // Users see only their bookings

      console.log('Filtered bookings for user:', filteredBookings)

      // Transform database bookings to match our interface
      const transformedBookings: Booking[] = filteredBookings.map((dbBooking: BookingData) => {
        const bookingDate = new Date(dbBooking.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Determine status based on date
        let status: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming'
        if (bookingDate < today) {
          status = 'completed'
        } else if (bookingDate.toDateString() === today.toDateString()) {
          status = 'active'
        }

        // Create seat labels from seat data - show only seat numbers
        const seatLabels = dbBooking.seats?.map(seat => seat.number.toString()) || []

        return {
          bookingId: dbBooking.bookingId,
          type: dbBooking.type,
          title: dbBooking.type === 'event' 
            ? (dbBooking.event?.name || 'Event Booking')
            : (dbBooking.pond?.name || 'Pond Session'),
          location: dbBooking.pond?.name || 'Unknown Location',
          date: dbBooking.date,
          time: dbBooking.timeSlot?.time || 'Time TBD',
          status,
          price: dbBooking.totalPrice,
          qrCode: dbBooking.bookingId.slice(-6).toUpperCase(), // Use last 6 chars of booking ID
          seats: seatLabels,
          instructions: dbBooking.type === 'event' 
            ? 'Arrive 30 minutes early for registration. Bring your own equipment and valid fishing license.'
            : 'Equipment rental available on-site. Check weather conditions before arrival.',
          // Add user info for managers
          ...(isManager && {
            userName: dbBooking.userName,
            userEmail: dbBooking.userEmail,
            userId: dbBooking.userId?.toString() // Convert number to string
          }),
          // Add event-specific data if it's an event booking
          ...(dbBooking.type === 'event' && dbBooking.event ? {
            participants: undefined, // We don't track this per booking
            maxParticipants: undefined
          } : {})
        }
      })

      // Sort bookings by date, ascending (nearest events first)
      transformedBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setBookings(transformedBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // load bookings when component mounts
    ;(async () => { await loadBookings() })()
  }, [])

  // Also reload bookings when user changes
  useEffect(() => {
    if (user) {
      console.log('User state changed in BookingsContent, reloading bookings')
      ;(async () => { await loadBookings() })()
    }
  }, [user])

  const handleDeleteBooking = (bookingId: string) => {
    try {
      // Call server API to cancel booking
      fetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
        .then(async (res) => {
          if (res.ok) {
            await loadBookings()
          } else {
            const j = await res.json().catch(() => ({}))
            toast ? toast.push({ message: j.error || 'Failed to delete booking. Please try again.', variant: 'error' }) : window.alert(j.error || 'Failed to delete booking. Please try again.')
          }
        })
        .catch((err) => {
          console.error('Error deleting booking:', err)
          toast ? toast.push({ message: 'Error deleting booking. Please try again.', variant: 'error' }) : window.alert('Error deleting booking. Please try again.')
        })
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast ? toast.push({ message: 'Error deleting booking. Please try again.', variant: 'error' }) : window.alert('Error deleting booking. Please try again.')
    }
  }

  const upcomingBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'active')
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">
                {isManager ? 'All Bookings' : 'My Bookings'}
              </h1>
              <p className="text-sm text-gray-600">
                {isManager ? 'Loading all user bookings...' : 'Loading your bookings...'}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-md mx-auto p-4">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
        {isManager ? <ManagerNavigation /> : <BottomNavigation />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">
              {isManager ? 'All Bookings' : 'My Bookings'}
            </h1>
            <p className="text-sm text-gray-600">
              {isManager ? 'User bookings and reservations' : 'Your fishing sessions and events'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <TicketCard key={booking.bookingId} booking={booking} onDelete={handleDeleteBooking} />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎣</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isManager ? 'No Upcoming Bookings Found' : 'No Upcoming Bookings'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isManager 
                    ? 'No users have upcoming bookings at this time.'
                    : 'Book a pond session or join an event to get started!'
                  }
                </p>
                {!isManager && (
                  <div className="space-y-2">
                    <Link href="/book">
                      <Button className="w-full">
                        <Fish className="h-4 w-4 mr-2" />
                        Book a Pond
                      </Button>
                    </Link>
                    <Link href="/book">
                      <Button variant="outline" className="w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        Join Event
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            {pastBookings.length > 0 ? (
              pastBookings.map((booking) => (
                <TicketCard key={booking.bookingId} booking={booking} onDelete={handleDeleteBooking} />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isManager ? 'No Past Bookings Found' : 'No Past Bookings'}
                </h3>
                <p className="text-gray-600">
                  {isManager 
                    ? 'No completed bookings found in the system.'
                    : 'Your completed bookings will appear here.'
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isManager ? <ManagerNavigation /> : <BottomNavigation />}
    </div>
  )
}

export default function BookingsPage() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  )
}
