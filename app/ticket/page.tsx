'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2, MapPin, Clock, Users, QrCode as QrCodeIcon } from "lucide-react"
import Link from "next/link"
import QRCode from 'qrcode'
import { getCurrentBooking, getBookingById, getAllBookings, } from "@/lib/localStorage"
import type { BookingData as DatabaseBookingData } from "@/types"
import { BottomNavigation } from '@/components/BottomNavigation'

function TicketContent() {
  const [bookingData, setBookingData] = useState<DatabaseBookingData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const searchParams = useSearchParams()
  
  // Check if we're coming from bookings page (showing specific booking)
  const bookingId = searchParams.get('bookingId')
  const source = searchParams.get('source')
  const isFromBookings = source === 'bookings' && !!bookingId
  
  useEffect(() => {
    // Get booking ID from URL params - check both 'bookingId' (from bookings page) and 'booking' (legacy)
    const bookingIdFromUrl = searchParams.get('bookingId') || searchParams.get('booking')
    
    let currentBooking: DatabaseBookingData | null = null
    
    // If a specific booking ID is provided, get that booking
    if (bookingIdFromUrl) {
      currentBooking = getBookingById(bookingIdFromUrl)
    } else {
      // Otherwise get the current booking
      currentBooking = getCurrentBooking()
    }
    
    if (currentBooking) {
      setBookingData(currentBooking)

      // Generate QR code with the booking data
      if (currentBooking.pond && currentBooking.pond.name && currentBooking.seats && currentBooking.timeSlot) {
        const qrData = JSON.stringify({
          bookingId: currentBooking.bookingId,
          pond: currentBooking.pond.name,
          seats: currentBooking.seats.map(s => s.number.toString()),
          date: currentBooking.date,
          timeSlot: currentBooking.timeSlot.time
        })

        QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        }).then(url => {
          setQrCodeUrl(url)
        }).catch(error => {
          console.error('Error generating QR code:', error)
        })
      }
    }
  }, [searchParams])

  // Download function
  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `ticket-${bookingData?.bookingId || 'unknown'}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  // Simplified QR view for bookings screen
  if (isFromBookings && bookingData) {
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
                  <h1 className="text-lg font-bold text-gray-900">Ticket QR Code</h1>
                  <p className="text-xs text-gray-500">{bookingData.pond?.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          {/* QR Code Ticket */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{bookingData.pond?.image || '🌊'}</div>
                    <div>
                      <h3 className="font-bold">{bookingData.pond?.name || 'Unknown Pond'}</h3>
                      <p className="text-blue-100 text-sm">
                        {bookingData.type === 'event' ? (
                          <span className="flex items-center gap-1">
                            🏆 {bookingData.event?.name || 'Competition Event'}
                          </span>
                        ) : (
                          'Regular Fishing Session'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-white/20 text-white mb-1">
                      {bookingData.bookingId}
                    </Badge>
                    {bookingData.type === 'event' && (
                      <div className="text-xs text-blue-100">Competition</div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 text-center">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="mx-auto rounded-lg shadow-sm"
                    style={{ maxWidth: '200px' }}
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">Show this QR code at the pond entrance</p>
              </div>

              {/* Ticket Details */}
              <div className="p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Location</span>
                  </div>
                  <span className="font-medium">{bookingData.pond?.name || 'Unknown Pond'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{bookingData.type === 'event' ? 'Position' : 'Seats'}</span>
                  </div>
                  <span className="font-medium">
                    {bookingData.seats?.map(s => s.number.toString()).join(', ') || 'No seats selected'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Date & Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-GB') : 'Unknown date'}</div>
                    <div className="text-sm text-gray-600">{bookingData.timeSlot?.time || 'Unknown time'}</div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{bookingData.type === 'event' ? 'Entry Fee' : 'Total Paid'}</span>
                    <span className="text-lg font-bold text-green-600">${bookingData.totalPrice || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCodeIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Booking Found</h2>
          <p className="text-gray-600 mb-4">
            It looks like you haven't completed a booking yet, or the booking data has expired.
          </p>
          <div className="space-y-2">
            <Link href="/">
              <Button className="w-full">Browse Ponds</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="w-full">View My Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleShare = async () => {
    if (!bookingData || !bookingData.pond) {
      alert('Booking data is incomplete')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Fishing Ticket - ${bookingData.pond.name || 'Unknown Pond'}`,
          text: `My fishing reservation for ${bookingData.pond.name || 'Unknown Pond'} on ${bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-GB') : 'Unknown date'}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/book">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Your Ticket</h1>
                <p className="text-xs text-gray-500">Booking confirmed</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Success Message */}
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCodeIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">Your fishing spot has been reserved</p>
        </div>

        {/* QR Code Ticket */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{bookingData.pond?.image || '🌊'}</div>
                  <div>
                    <h3 className="font-bold">{bookingData.pond?.name || 'Unknown Pond'}</h3>
                    <p className="text-blue-100 text-sm">
                      {bookingData.type === 'event' ? (
                        <span className="flex items-center gap-1">
                          🏆 {bookingData.event?.name || 'Competition Event'}
                        </span>
                      ) : (
                        'Regular Fishing Session'
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-white/20 text-white mb-1">
                    {bookingData.bookingId}
                  </Badge>
                  {bookingData.type === 'event' && (
                    <div className="text-xs text-blue-100">Competition</div>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 text-center">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto rounded-lg shadow-sm"
                  style={{ maxWidth: '200px' }}
                />
              )}
              <p className="text-xs text-gray-500 mt-2">Show this QR code at the pond entrance</p>
            </div>

            {/* Ticket Details */}
            <div className="p-4 bg-gray-50 space-y-3">
              {bookingData.type === 'event' && bookingData.event && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏆</span>
                    <span className="font-semibold text-yellow-800">Competition Details</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Event:</span>
                      <span className="font-medium text-yellow-900">{bookingData.event.name}</span>
                    </div>
                    {bookingData.event.prize && (
                      <div className="flex justify-between">
                        <span className="text-yellow-700">Prize Pool:</span>
                        <span className="font-bold text-yellow-900">{bookingData.event.prize}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Entry Fee:</span>
                      <span className="font-medium text-yellow-900">${bookingData.totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Location</span>
                </div>
                <span className="font-medium">{bookingData.pond?.name || 'Unknown Pond'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{bookingData.type === 'event' ? 'Position' : 'Seats'}</span>
                </div>
                <span className="font-medium">
                  {bookingData.seats?.map(s => {
                    console.log('Seat data in ticket:', s);
                    return s ? s.number.toString() : 'Unknown'
                  }).filter(Boolean).join(', ') || 'No seats selected'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Date & Time</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-GB') : 'Unknown date'}</div>
                  <div className="text-sm text-gray-600">{bookingData.timeSlot?.time || 'Unknown time'}</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{bookingData.type === 'event' ? 'Entry Fee' : 'Total Paid'}</span>
                  <span className="text-lg font-bold text-green-600">${bookingData.totalPrice || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entry Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Arrive 15 minutes early</p>
                <p className="text-sm text-gray-600">Check-in opens 15 minutes before your time slot</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Show QR code at entrance</p>
                <p className="text-sm text-gray-600">Staff will scan your QR code for entry</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Find your assigned seat</p>
                <p className="text-sm text-gray-600">Locate your seat number around the pond</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">4</span>
              </div>
              <div>
                <p className="font-medium">Enjoy fishing!</p>
                <p className="text-sm text-gray-600">Good luck and have a great time!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Link href="/scanner">
            <Button variant="outline" className="w-full">
              QR Scanner (Staff)
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full">
              Book Another Spot
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <QrCodeIcon className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-2" />
          <p>Loading ticket...</p>
        </div>
      </div>
    }>
      <TicketContent />
    </Suspense>
  )
}
