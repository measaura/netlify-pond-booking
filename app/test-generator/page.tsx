'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw, Database, QrCode as QrCodeIcon, Calendar, Clock, MapPin, Fish, Target, CheckCircle, XCircle } from "lucide-react"
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

interface RodTestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

interface GeneratedRod {
  seatQR: string
  rodId: string
  rodQR: string
  qrCodeUrl: string
  bookingDetails: {
    bookingId: string
    seatNumber: number
    userName: string
    pondName: string
    stationId: string
    isReplacement: boolean
  }
  testResult?: RodTestResult
}

export default function TestGeneratorPage() {
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [generatedRods, setGeneratedRods] = useState<GeneratedRod[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [rodTestInput, setRodTestInput] = useState('')
  const [stationId, setStationId] = useState('STATION-001')
  const [isReplacement, setIsReplacement] = useState(false)
  const [rodTestResult, setRodTestResult] = useState<RodTestResult | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure proper hydration
  useEffect(() => {
    setIsClient(true)
    // Additional delay to ensure DOM is fully ready
    setTimeout(() => {
      setIsMounted(true)
    }, 50)
  }, [])

  // Only calculate dates on client side to prevent hydration mismatch
  const [currentDate, setCurrentDate] = useState<string>('')
  const [activeTimeSlot, setActiveTimeSlot] = useState<string>('')
  const [yesterdayDate, setYesterdayDate] = useState<string>('')
  const [tomorrowDate, setTomorrowDate] = useState<string>('')
  
  useEffect(() => {
    if (isClient) {
      // Small delay to ensure hydration is complete
      setTimeout(() => {
        setCurrentDate(new Date().toISOString().split('T')[0])
        
        // Calculate active time slot
        const now = new Date()
        const startTime = new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
        const endTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
        const startHour = startTime.getHours().toString().padStart(2, '0')
        const startMin = startTime.getMinutes().toString().padStart(2, '0')
        const endHour = endTime.getHours().toString().padStart(2, '0')
        const endMin = endTime.getMinutes().toString().padStart(2, '0')
        setActiveTimeSlot(`${startHour}:${startMin}-${endHour}:${endMin}`)
        
        // Calculate yesterday and tomorrow dates
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setYesterdayDate(yesterday.toISOString().split('T')[0])
        
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setTomorrowDate(tomorrow.toISOString().split('T')[0])
      }, 10) // Very small delay to ensure DOM is ready
    }
  }, [isClient])

  const generateEventBooking = async (userId: number, userName: string, userEmail: string, timeSlot?: string, label?: string, customDate?: string) => {
    setIsGenerating(true)
    
    try {
      // Use dynamic time calculation if no timeSlot provided (for active sessions)
      let eventTimeSlot = timeSlot
      let eventDate = customDate || currentDate // Today or custom date
      
      if (!timeSlot) {
        // Use the pre-calculated active time slot
        eventTimeSlot = activeTimeSlot
      }

      // Get or create test user in database
      let testUser = null
      try {
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(userEmail)}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          testUser = userData.data
        } else {
          // User doesn't exist, create one
          const createUserResponse = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              name: userName,
              role: 'USER'
            })
          })
          if (createUserResponse.ok) {
            const newUserData = await createUserResponse.json()
            testUser = newUserData.data
          }
        }
      } catch (e) {
        console.error('Error handling user:', e)
      }

      if (!testUser) {
        throw new Error('Failed to create or find test user')
      }

      // Get available event from database
      const eventsResponse = await fetch('/api/events')
      const eventsData = await eventsResponse.json()
      const availableEvents = eventsData.data || []
      const activeEvent = availableEvents.find((e: any) => new Date(e.date) >= new Date(currentDate)) || availableEvents[0]

      if (!activeEvent) {
        throw new Error('No events available in database')
      }

      // Get available pond
      const pondsResponse = await fetch('/api/ponds')
      const pondsData = await pondsResponse.json()
      const availablePonds = pondsData.data || []
      const targetPond = availablePonds[0]

      if (!targetPond) {
        throw new Error('No ponds available in database')
      }

      // Create booking via API
      const bookingData = {
        type: 'event',
        bookedByUserId: testUser.id, // Use actual test user ID
        eventId: activeEvent.id,
        pondId: targetPond.id,
        date: eventDate,
        totalPrice: activeEvent.entryFee || 75,
        seats: [{
          number: userId + 10, // Different seat for each user
          assignedUserId: testUser.id,
          assignedName: userName,
          assignedEmail: userEmail
        }]
      }

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      const bookingResult = await bookingResponse.json()
      const booking = bookingResult.data

      // Use the actual QR code from the database seat assignment, not custom JSON
      const actualQRCode = booking.seats?.[0]?.qrCode || booking.seatAssignments?.[0]?.qrCode
      if (!actualQRCode) {
        throw new Error('No QR code found in booking response')
      }

      // Generate QR code data using the actual database QR code format
      const qrData = actualQRCode

      // Generate QR code image using the actual database QR code
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
        qrData: qrData, // Now uses the actual database QR code
        qrCodeUrl,
        bookingDetails: {
          ...booking,
          type: 'event' as const,
          pond: { id: targetPond.id, name: targetPond.name, image: '🌊' },
          event: { id: activeEvent.id, name: activeEvent.name, prize: `$${activeEvent.entryFee || 2500}` },
          seats: booking.seats || [{ id: userId + 10, row: 'A', number: userId + 10 }],
          timeSlot: { id: 7, time: eventTimeSlot, label: label || 'Active Event Session' },
          totalPrice: booking.totalPrice,
          createdAt: booking.createdAt,
          userId: booking.userId || userId,
          userName: booking.userName || userName,
          userEmail: booking.userEmail || userEmail,
          dateLabel: label || `${userName} - Active Event`,
          dateOffset: label ? 'TEST SCENARIO' : 'ACTIVE EVENT'
        }
      }

      setGeneratedQRs(prev => [newQR, ...prev])

      console.log('Generated event booking:', {
        booking,
        qrData,
        user: userName
      })

    } catch (error) {
      console.error('Error generating event booking:', error)
      alert(`Error creating booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTestBooking = async (daysOffset: number, timeSlot: string, label: string) => {
    setIsGenerating(true)
    
    try {
      // Calculate target date from client-only currentDate
      const baseDate = new Date(currentDate)
      baseDate.setDate(baseDate.getDate() + daysOffset)
      const testDate = baseDate
      
      // Get available pond and time slot from database
      const pondsResponse = await fetch('/api/ponds')
      const pondsData = await pondsResponse.json()
      const availablePonds = pondsData.data || []
      const targetPond = availablePonds[0]

      if (!targetPond) {
        throw new Error('No ponds available in database')
      }

      const timeSlotsResponse = await fetch('/api/timeSlots')
      const timeSlotsData = await timeSlotsResponse.json()
      const availableTimeSlots = timeSlotsData.data || []
      const targetTimeSlot = availableTimeSlots[0]

      // Generate test user data
      const testUserName = `Test User ${Math.random().toString(36).substr(2, 5)}`
      const testUserEmail = 'test@example.com'
      
      // Get or create test user
      let testUser = null
      try {
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(testUserEmail)}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          testUser = userData.data
        } else {
          // User doesn't exist, create one
          const createUserResponse = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: testUserEmail,
              name: testUserName,
              role: 'USER'
            })
          })
          if (createUserResponse.ok) {
            const newUserData = await createUserResponse.json()
            testUser = newUserData.data
          }
        }
      } catch (e) {
        console.error('Error handling user:', e)
      }

      if (!testUser) {
        throw new Error('Failed to create or find test user')
      }

      // Create booking via API
      const bookingData = {
        type: 'pond',
        bookedByUserId: testUser.id, // Use actual test user ID
        pondId: targetPond.id,
        timeSlotId: targetTimeSlot?.id,
        date: testDate.toISOString().split('T')[0],
        totalPrice: targetPond.price || 50,
        seats: [{
          number: Math.floor(Math.random() * 20) + 1, // Random seat 1-20
          assignedUserId: testUser.id,
          assignedName: testUserName,
          assignedEmail: testUserEmail
        }]
      }

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json()
        throw new Error(error.error || 'Failed to create booking')
      }

      const bookingResult = await bookingResponse.json()
      const booking = bookingResult.data

      // Use the actual QR code from the database seat assignment, not custom JSON
      const actualQRCode = booking.seats?.[0]?.qrCode || booking.seatAssignments?.[0]?.qrCode
      if (!actualQRCode) {
        throw new Error('No QR code found in booking response')
      }

      // Generate QR code data using the actual database QR code format
      const qrData = actualQRCode

      // Generate QR code image using the actual database QR code
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
        qrData: qrData, // Now uses the actual database QR code
        qrCodeUrl,
        bookingDetails: {
          ...booking,
          type: 'pond' as const,
          pond: { id: targetPond.id, name: targetPond.name, image: '🌊' },
          seats: booking.seats || [{ id: 1, row: 'A', number: bookingData.seats[0].number }],
          timeSlot: { 
            id: targetTimeSlot?.id || 1, 
            time: timeSlot, 
            label: `${timeSlot} Session` 
          },
          totalPrice: booking.totalPrice,
          createdAt: booking.createdAt,
          userId: booking.userId || 1001,
          userName: booking.userName || testUserName,
          userEmail: booking.userEmail || testUserEmail,
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
      alert(`Error creating booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Rod QR Testing Functions
  const generateRodQR = async (seatQRInput: string) => {
    setIsGenerating(true)
    setRodTestResult(null)
    
    try {
      // The seatQRInput should now be the actual database QR code (not JSON)
      const seatQRCode = seatQRInput.trim()

      // First, check in the seat using the checkins API
      try {
        const checkinResponse = await fetch('/api/checkins/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrCode: seatQRCode, // Use the actual QR code, not qrData
            scannedBy: 'test-generator'
          })
        })

        if (!checkinResponse.ok) {
          const checkinError = await checkinResponse.json()
          console.log('Check-in result:', checkinError.message || 'Check-in failed')
          // Continue even if check-in fails - the seat might already be checked in
        } else {
          console.log('Seat checked in successfully')
        }
      } catch (checkinError) {
        console.log('Check-in attempt failed, continuing with rod generation')
      }

      // Now test the rod printing API
      const response = await fetch('/api/rod-printing/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatQrCode: seatQRCode, // Use the actual QR code
          stationId: stationId,
          isReplacement: isReplacement
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Generate visual QR code for the rod QR
        const rodQRCode = await QRCode.toDataURL(result.data.rod.qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        })

        const newRod: GeneratedRod = {
          seatQR: seatQRInput,
          rodId: result.data.rod.qrCode,
          rodQR: result.data.rod.qrCode,
          qrCodeUrl: rodQRCode,
          bookingDetails: {
            bookingId: result.data.user.bookingId,
            seatNumber: result.data.user.seatNumber,
            userName: result.data.user.name, // Add user name for label display
            pondName: result.data.labelData.pondName, // Use specific pond name, not event name
            stationId: stationId,
            isReplacement: isReplacement
          },
          testResult: {
            success: true,
            message: 'Rod QR generated successfully!',
            data: result.data
          }
        }

        setGeneratedRods(prev => [newRod, ...prev])
        setRodTestResult({
          success: true,
          message: `🎣 Rod QR Generated Successfully!\n\n📋 Rod Details:\n• Rod ID: ${result.data.rod.id}\n• Rod QR: ${result.data.rod.qrCode}\n• Version: ${result.data.rod.version}\n\n👤 User Details:\n• Name: ${result.data.user.name}\n• Email: ${result.data.user.email}\n\n🎯 Booking Details:\n• Booking ID: ${result.data.user.bookingId}\n• Seat Number: ${result.data.user.seatNumber}\n• Event/Pond: ${result.data.labelData.eventName}\n• Date: ${result.data.labelData.date}${result.data.replacementInfo ? `\n\n🔄 Replacement Info:\n• Previous Rod: ${result.data.replacementInfo.previousRod}\n• Reason: ${result.data.replacementInfo.reason}` : ''}`,
          data: result.data
        })
        setRodTestInput('') // Clear input on success

        console.log('Rod QR generated:', result.data)
      } else {
        setRodTestResult({
          success: false,
          message: result.error || 'Failed to generate rod QR',
          error: result.error
        })
      }
    } catch (error) {
      console.error('Error generating rod QR:', error)
      setRodTestResult({
        success: false,
        message: 'Network error while generating rod QR',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const testRodStatus = async (rodQR: string) => {
    try {
      // Test rod validation using the GET method of the print endpoint
      const response = await fetch(`/api/rod-printing/print?qrCode=${encodeURIComponent(rodQR)}`)

      const result = await response.json()
      
      // Update the rod in our list with test result
      setGeneratedRods(prev => prev.map(rod => 
        rod.rodQR === rodQR 
          ? { 
              ...rod, 
              testResult: {
                success: response.ok,
                message: response.ok ? 'Rod status verified' : result.error,
                data: response.ok ? result.data : undefined,
                error: response.ok ? undefined : result.error
              }
            }
          : rod
      ))

      return { success: response.ok, data: result }
    } catch (error) {
      console.error('Error testing rod status:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const downloadRodQR = (qrCodeUrl: string, rodId: string) => {
    const link = document.createElement('a')
    link.download = `rod-qr-${rodId}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all test data? This will remove test bookings from the database.')) {
      try {
        // Clear generated UI state
        setGeneratedQRs([])
        setGeneratedRods([])
        setRodTestResult(null)
        setRodTestInput('')

        // Note: We could add an API endpoint to clear test bookings if needed
        // For now, just clear the UI state
        console.log('Test data UI cleared. Database bookings remain (use admin interface to remove if needed)')
        alert('Test UI data cleared. Database bookings remain for testing validation.')
      } catch (error) {
        console.error('Error clearing test data:', error)
        alert('Error clearing test data')
      }
    }
  }

  const downloadAllQRs = () => {
    // Download seat QRs
    generatedQRs.forEach((qr, index) => {
      setTimeout(() => {
        downloadQR(qr.qrCodeUrl, qr.bookingId, qr.bookingDetails.dateLabel)
      }, index * 500) // Stagger downloads by 500ms
    })
    
    // Download rod QRs
    generatedRods.forEach((rod, index) => {
      setTimeout(() => {
        downloadRodQR(rod.qrCodeUrl, rod.rodId)
      }, (generatedQRs.length + index) * 500) // Continue staggering after seat QRs
    })
  }

  // Prevent hydration mismatch - don't render until fully mounted
  if (!isClient || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-purple-800">Test Generator</CardTitle>
                  <p className="text-purple-600">Loading...</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* Generator Panel */}
          <Card className="border-blue-200 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <QrCodeIcon className="h-5 w-5" />
                Seat QR Generator
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
                    disabled={!isClient || !isMounted || !activeTimeSlot || isGenerating}
                  >
                    🟢 User1 (John Doe) - Active Event QR
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => generateEventBooking(2, 'Jane Smith', 'user2@fishing.com')} // No timeSlot = active now
                    className="text-xs bg-green-600 hover:bg-green-700"
                    disabled={!isClient || !activeTimeSlot || isGenerating}
                  >
                    🟢 User2 (Jane Smith) - Active Event QR
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => generateEventBooking(3, 'Mike Johnson', 'user3@fishing.com')} // No timeSlot = active now
                    className="text-xs bg-green-600 hover:bg-green-700"
                    disabled={!isClient || !activeTimeSlot || isGenerating}
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
                        const pastTimeSlot = '10:00 - 14:00'
                        generateEventBooking(1, 'John Doe', 'user1@fishing.com', pastTimeSlot, 'Past Event (Yesterday)', yesterdayDate)
                      }}
                      className="text-xs"
                      disabled={!isClient || !yesterdayDate || isGenerating}
                    >
                      📆 Past Event QR
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const futureTimeSlot = '09:00 - 15:00'
                        generateEventBooking(2, 'Jane Smith', 'user2@fishing.com', futureTimeSlot, 'Future Event (Tomorrow)', tomorrowDate)
                      }}
                      className="text-xs"
                      disabled={!isClient || !tomorrowDate || isGenerating}
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
                    generateTestBooking(0, activeTimeSlot, `Today ${activeTimeSlot} (ACTIVE NOW)`)
                  }}
                  className="text-xs bg-green-50 border-green-300 hover:bg-green-100"
                  disabled={!isClient || !activeTimeSlot || isGenerating}
                >
                  🟢 Active Session
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(0, '13:00-16:00', 'Today 1PM-4PM')}
                  className="text-xs"
                  disabled={!isClient || !currentDate || isGenerating}
                >
                  Today 1PM-4PM
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(-1, '09:00-12:00', 'Yesterday 9AM')}
                  className="text-xs"
                  disabled={!isClient || !currentDate || isGenerating}
                >
                  Yesterday 9AM
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateTestBooking(1, '09:00-12:00', 'Tomorrow 9AM')}
                  className="text-xs"
                  disabled={!isClient || !currentDate || isGenerating}
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
                  disabled={generatedQRs.length === 0 && generatedRods.length === 0}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({generatedQRs.length + generatedRods.length})
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
          <Card className="border-orange-200 h-fit">
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
                  <li>• <strong>Past Event QRs</strong>: Yesterday&apos;s events - wrong date</li>
                  <li>• <strong>Future Event QRs</strong>: Tomorrow&apos;s events - wrong date</li>
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
                  <li>5. Record catches using &quot;Add Catch&quot; tab</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rod QR Testing Panel */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Fish className="h-5 w-5" />
              🎣 Rod QR Testing System
            </CardTitle>
            <p className="text-sm text-red-700 mt-1">
              Generate fishing rod QR codes from seat QRs (no printer required)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rod Generator */}
              <div>
                <h4 className="font-semibold text-red-900 mb-3">🏭 Rod QR Generator</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seat QR Code (from generated QRs above):
                    </label>
                    <Input
                      value={rodTestInput}
                      onChange={(e) => setRodTestInput(e.target.value)}
                      placeholder="Paste seat QR data here..."
                      className="text-xs"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Station ID:
                      </label>
                      <Input
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        placeholder="STATION-001"
                        className="text-xs"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="replacement"
                        checked={isReplacement}
                        onChange={(e) => setIsReplacement(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="replacement" className="text-sm text-gray-700">
                        Replacement Rod
                      </label>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => generateRodQR(rodTestInput)}
                    disabled={isGenerating || !rodTestInput.trim()}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Rod QR'}
                  </Button>
                </div>

                {/* Quick Test with Generated QRs */}
                {generatedQRs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h5 className="font-medium text-gray-700 mb-2 text-sm">Quick Test with Generated QRs:</h5>
                    <div className="space-y-2">
                      {generatedQRs.slice(0, 3).map((qr) => (
                        <Button
                          key={qr.bookingId}
                          variant="outline"
                          size="sm"
                          onClick={() => generateRodQR(qr.qrData)}
                          disabled={isGenerating}
                          className="w-full text-xs justify-start"
                        >
                          <Fish className="h-3 w-3 mr-2" />
                          {qr.bookingDetails.dateLabel} • Seat {qr.bookingDetails.seats[0].number}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rod Test Result */}
              <div>
                <h4 className="font-semibold text-red-900 mb-3">📊 Test Results</h4>
                
                {rodTestResult && (
                  <div className={`p-4 rounded-lg border ${
                    rodTestResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {rodTestResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {rodTestResult.success ? 'Success!' : 'Error'}
                      </span>
                    </div>
                    <pre className="text-sm mb-2 whitespace-pre-wrap font-sans">{rodTestResult.message}</pre>
                  </div>
                )}

                {!rodTestResult && (
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                    <p className="text-sm">Enter a seat QR code above and click &quot;Generate Rod QR&quot; to test the rod printing system.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated QR Codes */}
        {generatedQRs.length > 0 && (
          <Card className="mt-6 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <QrCodeIcon className="h-5 w-5" />
                Generated Seat QR Codes ({generatedQRs.length})
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
                            <span>{qr.bookingDetails.date}</span>
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

        {/* Generated Rod QR Codes */}
        {generatedRods.length > 0 && (
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Fish className="h-5 w-5" />
                Generated Rod QR Codes ({generatedRods.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {generatedRods.map((rod) => (
                  <div key={rod.rodId} className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    {/* Rod Label - Landscape Layout (20mm x 45mm) */}
                    <div className="flex items-center gap-2 p-2 border-2 border-dashed border-gray-300 bg-gray-50" 
                         style={{ width: '180px', height: '80px' }}>
                      {/* QR Code Section - Left (15mm x 15mm) */}
                      <div className="flex-shrink-0">
                        <img 
                          src={rod.qrCodeUrl} 
                          alt="Rod QR Code" 
                          className="border border-gray-400"
                          style={{ width: '60px', height: '60px' }}
                        />
                      </div>
                      
                      {/* User Info Section - Right */}
                      <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
                        <div className="font-bold text-sm text-gray-900 truncate leading-tight">
                          {rod.bookingDetails.userName || 'User'}
                        </div>
                        <div className="font-bold text-lg text-blue-600 truncate leading-tight">
                          Seat {rod.bookingDetails.seatNumber}
                        </div>
                        <div className="font-semibold text-xs text-green-700 truncate leading-tight">
                          {rod.bookingDetails.pondName || 'Pond'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status and Actions - Below the label */}
                    <div className="mt-2 space-y-2">
                      {/* Status Badges */}
                      <div className="flex justify-center gap-2">
                        {rod.bookingDetails.isReplacement && (
                          <Badge variant="destructive" className="text-xs">
                            Replacement
                          </Badge>
                        )}
                        {rod.testResult && (
                          <Badge variant={rod.testResult.success ? "default" : "destructive"} className="text-xs">
                            {rod.testResult.success ? "✓ Valid" : "✗ Error"}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Download Button */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => downloadRodQR(rod.qrCodeUrl, rod.rodId)}
                        className="text-xs w-full"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Label
                      </Button>
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
