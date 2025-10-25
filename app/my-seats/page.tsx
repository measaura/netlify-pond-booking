'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, MapPin, Clock, Users, QrCode as QrCodeIcon } from "lucide-react"
import Link from "next/link"
import QRCode from 'qrcode'
import { BottomNavigation } from '@/components/BottomNavigation'
import { formatDate, formatEventTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

interface SeatInfo {
  id: string
  seatNumber: number
  qrCode: string
  status: string
}

interface BookingInfo {
  bookingId: string
  type: string
  bookingDate: string
  totalSeats: number
  event?: {
    name: string
    startTime: string
    endTime: string
  }
  game?: {
    name: string
  }
  pond: {
    name: string
    image?: string
  }
  mySeats: SeatInfo[]
  totalPrice?: number
}

function MySeatsContent() {
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const bookingId = searchParams.get('bookingId')

  useEffect(() => {
    if (!bookingId || !user) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        console.log('🔍 Loading seats for:', { bookingId, userEmail: user.email })
        
        // Fetch booking details
        const bookingRes = await fetch(`/api/bookings/${bookingId}`)
        const bookingData = await bookingRes.json()
        
        if (!bookingData.ok) {
          console.error('Failed to load booking')
          return
        }

        // Fetch seats
        const seatsRes = await fetch(`/api/bookings/${bookingId}/seats/share`)
        const seatsData = await seatsRes.json()

        if (!seatsData.ok) {
          console.error('Failed to load seats')
          return
        }

        console.log('🎫 All seats from API:', seatsData.seats)
        console.log('👤 Current user:', user)
        
        // Filter seats assigned to current user
        const mySeats = (seatsData.seats || []).filter((seat: any) => {
          const hasAssignedTo = seat.assignedTo && seat.assignedTo.email
          const emailMatches = hasAssignedTo && seat.assignedTo.email === user.email
          console.log(`Seat ${seat.seatNumber}:`, {
            hasAssignedTo,
            assignedEmail: seat.assignedTo?.email,
            userEmail: user.email,
            emailMatches
          })
          return emailMatches
        })
        
        console.log('✅ Filtered seats for user:', mySeats)

        // Structure booking info
        const info: BookingInfo = {
          bookingId: bookingData.booking.id,
          type: bookingData.booking.event ? 'event' : 'session',
          bookingDate: bookingData.booking.bookingDate,
          totalSeats: bookingData.booking.totalSeats,
          event: bookingData.booking.event ? {
            name: bookingData.booking.event.name,
            startTime: bookingData.booking.startTime,
            endTime: bookingData.booking.endTime
          } : undefined,
          game: bookingData.booking.game ? {
            name: bookingData.booking.game.name
          } : undefined,
          pond: {
            name: bookingData.booking.pond.name,
            image: bookingData.booking.pond.image
          },
          mySeats: mySeats,
          totalPrice: bookingData.booking.totalPrice
        }

        setBookingInfo(info)

        // Generate QR codes for user's seats
        const qrPromises = mySeats.map(async (seat: SeatInfo) => {
          try {
            const dataUrl = await QRCode.toDataURL(seat.qrCode, {
              width: 256,
              margin: 2,
              color: {
                dark: '#1f2937',
                light: '#ffffff'
              }
            })
            return { id: seat.id, dataUrl }
          } catch (err) {
            console.error('Error generating QR for seat:', seat.seatNumber, err)
            return { id: seat.id, dataUrl: '' }
          }
        })

        const qrResults = await Promise.all(qrPromises)
        const qrMap = qrResults.reduce((acc, { id, dataUrl }) => {
          acc[id] = dataUrl
          return acc
        }, {} as Record<string, string>)

        setQrDataUrls(qrMap)

      } catch (err) {
        console.error('Error loading seat data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [bookingId, user])

  const handleDownloadQR = (seatNumber: number, qrDataUrl: string) => {
    if (qrDataUrl) {
      const link = document.createElement('a')
      link.download = `seat-${seatNumber}-qr.png`
      link.href = qrDataUrl
      link.click()
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <QrCodeIcon className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p>Loading your seats...</p>
        </div>
      </div>
    )
  }

  if (!bookingInfo || bookingInfo.mySeats.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Seats</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Seats Assigned</h2>
            <p className="text-gray-600 mb-4">
              You don&apos;t have any seats assigned for this booking yet.
            </p>
            <Link href="/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </div>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Seat QR Codes</h1>
                <p className="text-xs text-gray-500">{bookingInfo.pond.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Event Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-2xl">{bookingInfo.pond.image || '🌊'}</div>
                <div>
                  <CardTitle className="text-base">{bookingInfo.pond.name}</CardTitle>
                  {bookingInfo.event && (
                    <p className="text-sm text-blue-600 font-medium">🏆 {bookingInfo.event.name}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary">{bookingInfo.bookingId}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Date & Time</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatDate(bookingInfo.bookingDate)}</div>
                {bookingInfo.event && (
                  <div className="text-xs text-gray-600">
                    {formatEventTime(bookingInfo.event.startTime, bookingInfo.event.endTime)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>My Seats</span>
              </div>
              <div className="font-medium">
                {bookingInfo.mySeats.map(s => s.seatNumber).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seat QR Codes */}
        {bookingInfo.mySeats.map((seat) => (
          <Card key={seat.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Seat {seat.seatNumber}</CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {seat.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* QR Code */}
              <div className="text-center mb-4">
                {qrDataUrls[seat.id] && (
                  <img
                    src={qrDataUrls[seat.id]}
                    alt={`QR Code for Seat ${seat.seatNumber}`}
                    className="mx-auto rounded-lg shadow-sm"
                    style={{ maxWidth: '200px' }}
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Show this QR code at check-in for Seat {seat.seatNumber}
                </p>
              </div>

              {/* QR String */}
              <details className="mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View QR Code String
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                  {seat.qrCode}
                </div>
              </details>

              {/* Download Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleDownloadQR(seat.seatNumber, qrDataUrls[seat.id])}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-in Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Arrive 15 minutes early</p>
                <p className="text-gray-600 text-xs">Check-in opens before your session</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Show your seat QR code</p>
                <p className="text-gray-600 text-xs">Staff will scan each seat QR individually</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Find your seat number</p>
                <p className="text-gray-600 text-xs">Locate seat {bookingInfo.mySeats.map(s => s.seatNumber).join(', ')} around the pond</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">4</span>
              </div>
              <div>
                <p className="font-medium">Enjoy the event!</p>
                <p className="text-gray-600 text-xs">Good luck and have fun!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default function MySeatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <QrCodeIcon className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p>Loading seats...</p>
        </div>
      </div>
    }>
      <MySeatsContent />
    </Suspense>
  )
}
