'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw, Database, QrCode as QrCodeIcon, Calendar, Clock, MapPin } from "lucide-react"
import QRCode from 'qrcode'
import type { BookingData } from "@/types"

interface GeneratedQR {
  bookingId: string
  qrData: string
  qrCodeUrl: string
  bookingDetails: BookingData & {
    dateLabel: string
    dateOffset: string
  }
}

export default function TestGeneratorPage() {
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateEventBooking = async (userId: number, userName: string, userEmail: string, timeSlot?: string, label?: string, customDate?: string) => {
    setIsGenerating(true)
    
    try {
      // Use dynamic time calculation if no timeSlot provided (for active sessions)
      let eventTimeSlot = timeSlot
      let eventDate = customDate || new Date().toISOString().split('T')[0] // Today or custom date
      
      if (!timeSlot) {
        // Generate current active time slot (started 2 min ago, ends in 30 min) - same as pond generator
        const now = new Date()
        const startTime = new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
        const endTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
        const startHour = startTime.getHours().toString().padStart(2, '0')
        const startMin = startTime.getMinutes().toString().padStart(2, '0')
        const endHour = endTime.getHours().toString().padStart(2, '0')
        const endMin = endTime.getMinutes().toString().padStart(2, '0')
        eventTimeSlot = `${startHour}:${startMin} - ${endHour}:${endMin}`
      }
      
      // Use the active event from database
      const eventBooking: BookingData = {
        bookingId: `EVENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event' as const,
        pond: {
          id: 1,
          name: 'Emerald Lake',
          image: '🌊'
        },
        event: {
          id: 1,
          name: 'Live Fishing Championship',
          prize: '$2,500'
        },
        seats: [{
          id: userId + 10, // Different seat for each user
          row: 'A',
          number: userId + 10
        }],
        timeSlot: {
          id: 7,
          time: eventTimeSlot || '14:06 - 14:31',
          label: label || 'Active Event Session'
        },
        date: eventDate,
        totalPrice: 75,
        createdAt: new Date().toISOString(),
        userId: userId,
        userName: userName,
        userEmail: userEmail
      }

      // Add to localStorage database
      const db = JSON.parse(localStorage.getItem('fishingAppDB') || '{"bookings":[],"checkIns":[],"events":[]}')
      db.bookings.push(eventBooking)
      localStorage.setItem('fishingAppDB', JSON.stringify(db))

      // Generate QR code data
      const qrData = JSON.stringify({
        bookingId: eventBooking.bookingId,
        pond: eventBooking.pond.name,
        event: eventBooking.event?.name || 'Live Fishing Championship',
        seats: eventBooking.seats.map(s => s.number.toString()),
        date: eventBooking.date,
        timeSlot: eventBooking.timeSlot.time
      })

      // Generate QR code image
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      })

      const newQR: GeneratedQR = {
        bookingId: eventBooking.bookingId,
        qrData,
        qrCodeUrl,
        bookingDetails: {
          ...eventBooking,
          dateLabel: label || `${userName} - Active Event`,
          dateOffset: label ? 'TEST SCENARIO' : 'ACTIVE EVENT'
        }
      }

      setGeneratedQRs(prev => [newQR, ...prev])

      console.log('Generated event booking:', {
        booking: eventBooking,
        qrData,
        user: userName
      })

    } catch (error) {
      console.error('Error generating event booking:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTestBooking = async (daysOffset: number, timeSlot: string, label: string) => {
    setIsGenerating(true)
    
    try {
      const testDate = new Date()
      testDate.setDate(testDate.getDate() + daysOffset)
      
      // Create complete booking data that matches the actual structure
      const booking: BookingData = {
        bookingId: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'pond' as const,
        pond: {
          id: 1,
          name: 'Test Pond A',
          image: '🌊'
        },
        seats: [{
          id: 1,
          row: 'A',
          number: Math.floor(Math.random() * 20) + 1 // Random seat 1-20
        }],
        timeSlot: {
          id: 1,
          time: timeSlot,
          label: `${timeSlot} Session`
        },
        date: testDate.toISOString().split('T')[0],
        totalPrice: 50,
        createdAt: new Date().toISOString(),
        
        // User information (required fields)
        userId: 1001,
        userName: `Test User ${Math.random().toString(36).substr(2, 5)}`,
        userEmail: 'test@example.com'
      }

      // Add to localStorage database (using correct key that validation uses)
      const db = JSON.parse(localStorage.getItem('fishingAppDB') || '{"bookings":[],"checkIns":[],"events":[]}')
      db.bookings.push(booking)
      localStorage.setItem('fishingAppDB', JSON.stringify(db))

      // Generate QR code data (exactly as done in ticket page)
      const qrData = JSON.stringify({
        bookingId: booking.bookingId,
        pond: booking.pond.name,
        seats: booking.seats.map(s => s.number.toString()),
        date: booking.date,
        timeSlot: booking.timeSlot.time
      })

      // Generate QR code image
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      })

      const newQR: GeneratedQR = {
        bookingId: booking.bookingId,
        qrData,
        qrCodeUrl,
        bookingDetails: {
          ...booking,
          dateLabel: label,
          dateOffset: daysOffset === 0 ? 'TODAY' : daysOffset > 0 ? `+${daysOffset} days` : `${daysOffset} days`
        }
      }

      setGeneratedQRs(prev => [newQR, ...prev])

      console.log('Generated test booking:', {
        booking,
        qrData,
        dateOffset: daysOffset === 0 ? 'TODAY' : daysOffset > 0 ? `+${daysOffset} days` : `${daysOffset} days`
      })

    } catch (error) {
      console.error('Error generating test booking:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQR = (qrCodeUrl: string, bookingId: string, label: string) => {
    const link = document.createElement('a')
    link.download = `test-booking-${bookingId}-${label.replace(/\s+/g, '-')}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all test data? This will remove all generated bookings and QR codes.')) {
      localStorage.removeItem('fishingAppDB')
      setGeneratedQRs([])
      console.log('All test data cleared')
    }
  }

  const downloadAllQRs = () => {
    generatedQRs.forEach((qr, index) => {
      setTimeout(() => {
        downloadQR(qr.qrCodeUrl, qr.bookingId, qr.bookingDetails.dateLabel)
      }, index * 500) // Stagger downloads by 500ms
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-purple-900">🧪 Test Data Generator</CardTitle>
                <p className="text-sm text-purple-700 mt-1">
                  Generate test bookings and QR codes for development and testing
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Panel */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <QrCodeIcon className="h-5 w-5" />
                QR Code Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Event Booking Section */}
              <div className="mb-6">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  🏆 Active Event Bookings
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Live Fishing Championship
                  </Badge>
                </h4>
                <div className="grid grid-cols-1 gap-2 mb-3">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => generateEventBooking(1, 'John Doe', 'user1@fishing.com')} // No timeSlot = active now
                    className="text-xs bg-green-600 hover:bg-green-700"
                    disabled={isGenerating}
                  >
                    🟢 User1 (John Doe) - Active Event QR
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => generateEventBooking(2, 'Jane Smith', 'user2@fishing.com')} // No timeSlot = active now
                    className="text-xs bg-green-600 hover:bg-green-700"
                    disabled={isGenerating}
                  >
                    🟢 User2 (Jane Smith) - Active Event QR
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => generateEventBooking(3, 'Mike Johnson', 'user3@fishing.com')} // No timeSlot = active now
                    className="text-xs bg-green-600 hover:bg-green-700"
                    disabled={isGenerating}
                  >
                    🟢 User3 (Mike Johnson) - Active Event QR
                  </Button>
                </div>
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  📅 Event: Active NOW (started 2 min ago, ends in 30 min) • 🏞️ Emerald Lake • 💰 $75 entry
                </div>
                
                {/* Past/Future Event Bookings */}
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2 text-xs">Test Different Scenarios:</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Past event (yesterday)
                        const yesterday = new Date()
                        yesterday.setDate(yesterday.getDate() - 1)
                        const pastTimeSlot = '10:00 - 14:00'
                        const pastDate = yesterday.toISOString().split('T')[0]
                        generateEventBooking(1, 'John Doe', 'user1@fishing.com', pastTimeSlot, 'Past Event (Yesterday)', pastDate)
                      }}
                      className="text-xs"
                      disabled={isGenerating}
                    >
                      📆 Past Event QR
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Future event (tomorrow)
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        const futureTimeSlot = '09:00 - 15:00'
                        const futureDate = tomorrow.toISOString().split('T')[0]
                        generateEventBooking(2, 'Jane Smith', 'user2@fishing.com', futureTimeSlot, 'Future Event (Tomorrow)', futureDate)
                      }}
                      className="text-xs"
                      disabled={isGenerating}
                    >
                      � Future Event QR
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-blue-900 mb-3">📝 Regular Pond Sessions</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Generate current active time slot (started 2 min ago, ends in 30 min)
                    const now = new Date()
                    const startTime = new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
                    const endTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
                    const startHour = startTime.getHours().toString().padStart(2, '0')
                    const startMin = startTime.getMinutes().toString().padStart(2, '0')
                    const endHour = endTime.getHours().toString().padStart(2, '0')
                    const endMin = endTime.getMinutes().toString().padStart(2, '0')
                    const timeSlot = `${startHour}:${startMin}-${endHour}:${endMin}`
                    
                    generateTestBooking(0, timeSlot, `Today ${timeSlot} (ACTIVE NOW)`)
                  }}
                  className="text-xs bg-green-50 border-green-300 hover:bg-green-100"
                  disabled={isGenerating}
                >
                  🟢 Active Session
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(0, '13:00-16:00', 'Today 1PM-4PM')}
                  className="text-xs"
                  disabled={isGenerating}
                >
                  Today 1PM-4PM
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(-1, '09:00-12:00', 'Yesterday 9AM')}
                  className="text-xs"
                  disabled={isGenerating}
                >
                  Yesterday 9AM
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(1, '09:00-12:00', 'Tomorrow 9AM')}
                  className="text-xs"
                  disabled={isGenerating}
                >
                  Tomorrow 9AM
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(-7, '13:00-16:00', 'Last Week')}
                  className="text-xs"
                  disabled={isGenerating}
                >
                  Last Week
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(7, '13:00-16:00', 'Next Week')}
                  className="text-xs"
                  disabled={isGenerating}
                >
                  Next Week
                </Button>
              </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadAllQRs}
                  disabled={generatedQRs.length === 0}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={clearAllData}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Calendar className="h-5 w-5" />
                Usage Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Purpose</h4>
                <p className="text-blue-700">Generate realistic test bookings with QR codes using real-time calculations to test the scanner validation system.</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ Valid Scenarios</h4>
                <ul className="text-green-700 space-y-1">
                  <li>• <strong>Active Event QRs</strong>: Started 2 min ago, ends in 30 min - should allow check-in</li>
                  <li>• <strong>Active Sessions</strong>: Started 2 min ago, ends in 30 min - should allow check-in</li>
                  <li>• <strong>Today sessions</strong>: Valid if within time window</li>
                </ul>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">❌ Invalid Scenarios</h4>
                <ul className="text-red-700 space-y-1">
                  <li>• <strong>Past Event QRs</strong>: Yesterday's events - wrong date</li>
                  <li>• <strong>Future Event QRs</strong>: Tomorrow's events - wrong date</li>
                  <li>• <strong>Past/Future weeks</strong>: Wrong date</li>
                  <li>• <strong>Outside time slots</strong>: Wrong time</li>
                </ul>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">📱 Testing</h4>
                <ol className="text-yellow-700 space-y-1">
                  <li>1. Generate test bookings (times calculated dynamically)</li>
                  <li>2. Download QR codes</li>
                  <li>3. Transfer to phone via AirDrop</li>
                  <li>4. Test with scanner at /scanner or /dedicated-scanner</li>
                  <li>5. Record catches using "Add Catch" tab</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated QR Codes */}
        {generatedQRs.length > 0 && (
          <Card className="mt-6 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <QrCodeIcon className="h-5 w-5" />
                Generated QR Codes ({generatedQRs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {generatedQRs.map((qr) => (
                  <div key={qr.bookingId} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex gap-4">
                      <img 
                        src={qr.qrCodeUrl} 
                        alt="QR Code" 
                        className="w-20 h-20 border rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {qr.bookingId.split('-').pop()}
                          </Badge>
                          <Badge variant={qr.bookingDetails.dateOffset === 'TODAY' ? 'default' : 'secondary'} className="text-xs">
                            {qr.bookingDetails.dateOffset}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(qr.bookingDetails.date).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{qr.bookingDetails.timeSlot.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>Seat {qr.bookingDetails.seats[0].number}</span>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => downloadQR(qr.qrCodeUrl, qr.bookingId, qr.bookingDetails.dateLabel)}
                          className="mt-2 text-xs w-full"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <p className="text-xs text-gray-500">
          🔗 Access this page directly at <code className="bg-gray-100 px-2 py-1 rounded">/test-generator</code>
        </p>
      </div>
    </div>
  )
}
