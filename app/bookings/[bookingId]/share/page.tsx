'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Share2, Check, Clock, Users, QrCode, 
  ArrowLeft, Mail, AlertCircle, UserPlus,
  CheckCircle, Calendar
} from "lucide-react"
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import QRCode from 'qrcode'

interface BookingSeat {
  id: string
  seatNumber: number
  qrCode: string
  status: string
  assignedToId: string | null
  assignedTo: {
    id: string
    name: string
    email: string
    nickname: string | null
  } | null
  sharedAt: string | null
  sharedBy: string | null
  checkedInAt: string | null
}

interface BookingInfo {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  totalSeats: number
  event: {
    id: string
    name: string
    description: string | null
  }
  game: {
    id: string
    name: string
  }
  pond: {
    id: string
    name: string
  }
}

export default function ShareSeatsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [seats, setSeats] = useState<BookingSeat[]>([])
  const [loading, setLoading] = useState(true)
  const [assignEmail, setAssignEmail] = useState('')
  const [selectedSeat, setSelectedSeat] = useState<BookingSeat | null>(null)
  const [processing, setProcessing] = useState(false)
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    loadBookingAndSeats()
  }, [bookingId])

  const loadBookingAndSeats = async () => {
    try {
      setLoading(true)
      
      // Fetch booking details
      const bookingRes = await fetch(`/api/bookings/${bookingId}`)
      const bookingData = await bookingRes.json()
      
      if (bookingData.ok) {
        setBooking(bookingData.booking)
      }

      // Fetch seats
      const seatsRes = await fetch(`/api/bookings/${bookingId}/seats/share`)
      const seatsData = await seatsRes.json()

      if (seatsData.ok) {
        setSeats(seatsData.seats || [])
        
        // Generate QR codes for all seats
        const qrPromises = (seatsData.seats || []).map(async (seat: BookingSeat) => {
          try {
            const dataUrl = await QRCode.toDataURL(seat.qrCode, {
              width: 200,
              margin: 2
            })
            return { id: seat.id, dataUrl }
          } catch (error) {
            console.error('QR generation error:', error)
            return { id: seat.id, dataUrl: '' }
          }
        })
        
        const qrResults = await Promise.all(qrPromises)
        const qrMap = qrResults.reduce((acc, { id, dataUrl }) => {
          acc[id] = dataUrl
          return acc
        }, {} as Record<string, string>)
        
        setQrDataUrls(qrMap)
      }

    } catch (error) {
      console.error('Failed to load booking:', error)
      alert('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignSeat = async () => {
    if (!selectedSeat || !assignEmail.trim()) {
      alert('Please enter a valid email address')
      return
    }

    try {
      setProcessing(true)

      const res = await fetch(`/api/bookings/${bookingId}/seats/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: selectedSeat.id,
          userEmail: assignEmail.trim()
        })
      })

      const data = await res.json()

      if (!data.ok) {
        alert(data.error || 'Failed to assign seat')
        return
      }

      alert(`Seat #${selectedSeat.seatNumber} has been assigned to ${assignEmail}`)
      setAssignEmail('')
      setSelectedSeat(null)
      
      // Reload seats
      await loadBookingAndSeats()

    } catch (error: any) {
      console.error('Assignment error:', error)
      alert(error.message || 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const getSeatStatusColor = (status: string, checkedInAt: string | null) => {
    if (checkedInAt) return 'bg-purple-100 text-purple-800 border-purple-300'
    
    switch (status) {
      case 'shared': return 'bg-green-100 text-green-800 border-green-300'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'checked-in': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    }
  }

  const getSeatStatusIcon = (status: string, checkedInAt: string | null) => {
    if (checkedInAt) return <CheckCircle className="h-4 w-4" />
    
    switch (status) {
      case 'shared': return <Check className="h-4 w-4" />
      case 'assigned': return <Clock className="h-4 w-4" />
      case 'checked-in': return <CheckCircle className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getSeatStatusText = (status: string, checkedInAt: string | null) => {
    if (checkedInAt) return 'Checked In'
    
    switch (status) {
      case 'shared': return 'Shared'
      case 'assigned': return 'Available'
      case 'checked-in': return 'Checked In'
      case 'completed': return 'Completed'
      default: return 'Pending'
    }
  }

  const canAssignSeat = (seat: BookingSeat) => {
    return !seat.assignedToId && !seat.checkedInAt && seat.status !== 'checked-in'
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!booking) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Booking Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/bookings')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/bookings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
          </div>

          {/* Booking Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{booking.event.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {booking.game.name} at {booking.pond.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(booking.bookingDate)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Time:</span>
                  <p className="font-semibold">{booking.startTime} - {booking.endTime}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Seats:</span>
                  <p className="font-semibold">{booking.totalSeats}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Seat Sharing Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>You can assign unassigned seats to other registered users</li>
                      <li>Enter the user&apos;s email address to assign a seat</li>
                      <li>They will receive a notification with their seat QR code</li>
                      <li>Once checked in, seats cannot be reassigned</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seats.map((seat) => (
              <Card 
                key={seat.id} 
                className={`${
                  selectedSeat?.id === seat.id 
                    ? 'ring-2 ring-blue-500' 
                    : ''
                } transition-all`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Seat #{seat.seatNumber}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`mt-2 ${getSeatStatusColor(seat.status, seat.checkedInAt)}`}
                      >
                        {getSeatStatusIcon(seat.status, seat.checkedInAt)}
                        <span className="ml-1">{getSeatStatusText(seat.status, seat.checkedInAt)}</span>
                      </Badge>
                    </div>
                    {qrDataUrls[seat.id] && (
                      <img 
                        src={qrDataUrls[seat.id]} 
                        alt={`Seat ${seat.seatNumber} QR`}
                        className="w-16 h-16 border rounded"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Assigned User Info */}
                  {seat.assignedTo ? (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <UserPlus className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">{seat.assignedTo.name}</p>
                          <p className="text-xs text-green-700">{seat.assignedTo.email}</p>
                          {seat.assignedTo.nickname && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              @{seat.assignedTo.nickname}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {seat.sharedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Assigned {new Date(seat.sharedAt).toLocaleString()}
                        </p>
                      )}
                      
                      {/* Show QR Code prominently for assigned seats */}
                      {qrDataUrls[seat.id] && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs font-semibold text-green-900 mb-2 text-center">
                            Check-in QR Code
                          </p>
                          <div className="bg-white p-3 rounded border border-green-300 text-center">
                            <img 
                              src={qrDataUrls[seat.id]} 
                              alt={`Seat ${seat.seatNumber} QR`}
                              className="w-full max-w-[160px] mx-auto"
                            />
                            <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                              {seat.qrCode}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 w-full text-xs"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = qrDataUrls[seat.id]
                                link.download = `seat-${seat.seatNumber}-qr.png`
                                link.click()
                              }}
                            >
                              <QrCode className="mr-1 h-3 w-3" />
                              Download QR Code
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Not assigned yet</p>
                    </div>
                  )}

                  {/* Assign Button */}
                  {canAssignSeat(seat) && (
                    <Button
                      onClick={() => setSelectedSeat(seat)}
                      variant={selectedSeat?.id === seat.id ? "default" : "outline"}
                      className="w-full"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {selectedSeat?.id === seat.id ? 'Selected' : 'Assign Seat'}
                    </Button>
                  )}

                  {/* QR Code for unassigned seats - collapsed */}
                  {!seat.assignedTo && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-900 flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        View QR Code: {seat.qrCode.slice(0, 20)}...
                      </summary>
                      <div className="mt-2 p-2 bg-white rounded border text-center">
                        {qrDataUrls[seat.id] && (
                          <>
                            <img 
                              src={qrDataUrls[seat.id]} 
                              alt={`Seat ${seat.seatNumber} QR`}
                              className="w-full max-w-[200px] mx-auto"
                            />
                            <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                              {seat.qrCode}
                            </p>
                          </>
                        )}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assignment Form */}
          {selectedSeat && (
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-600" />
                  Assign Seat #{selectedSeat.seatNumber}
                </CardTitle>
                <CardDescription>
                  Enter the email address of the user you want to assign this seat to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    <Mail className="inline h-4 w-4 mr-1" />
                    User Email Address
                  </label>
                  <Input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    The user must have a registered account in the system
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSeat(null)
                      setAssignEmail('')
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignSeat}
                    disabled={!assignEmail.trim() || processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Seat
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seat Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {seats.filter(s => s.assignedToId).length}
                  </p>
                  <p className="text-xs text-gray-600">Assigned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {seats.filter(s => s.checkedInAt).length}
                  </p>
                  <p className="text-xs text-gray-600">Checked In</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {seats.filter(s => canAssignSeat(s)).length}
                  </p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
