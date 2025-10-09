'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, DollarSign, Fish, Trophy, CreditCard } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { getBookedSeatsForEvent, saveEventBookingWithAvailabilityUpdate, getEventById, getEventAvailableSeats, getPondById, formatEventTimeRange } from "@/lib/localStorage"
import { useAuth } from '@/lib/auth'

// Generate seats based on pond shape and seating arrangement for events
const generateEventSeats = (pond: any, eventId: number, eventDate: string) => {
  if (!pond) return []
  
  const seats = []
  
  // Get already booked seats for this specific event
  const bookedSeatIds = getBookedSeatsForEvent(eventId, eventDate)

  // Use the pond's actual shape and seating arrangement
  const shape = pond.shape || 'rectangle'
  const seatingArrangement = pond.seatingArrangement || [3, 3, 3, 3]
  let seatId = 1

  if (shape === 'circle') {
    // Circular arrangement - seats arranged around the pond in a circle
    const totalSeats = seatingArrangement[0] || pond.capacity
    const angleStep = (2 * Math.PI) / totalSeats
    
    for (let i = 0; i < totalSeats; i++) {
      const angle = (i * angleStep) - (Math.PI / 2) // Start from top (-90 degrees)
      const isAlreadyBooked = bookedSeatIds.includes(seatId)

      // Use equal radius for both X and Y to maintain perfect circle
      const radius = 35 // Percentage radius from center
      
      seats.push({
        id: seatId,
        number: seatId,
        position: 'circle',
        angle: angle + (Math.PI / 2), // Add 90 degrees so seats face inward toward pond
        x: 50 + radius * Math.cos(angle), // Equal radius for X
        y: 50 + radius * Math.sin(angle), // Equal radius for Y
        status: isAlreadyBooked ? 'booked' : 'available'
      })
      seatId++
    }
  } else {
    // Rectangle or square arrangement with proper grid cell positioning
    const [topSeats, rightSeats, bottomSeats, leftSeats] = seatingArrangement
    
    // Create a grid: width = max(top, bottom) + 2, height = max(left, right) + 2
    const gridWidth = Math.max(topSeats, bottomSeats) + 2  // +2 for side columns
    const gridHeight = Math.max(leftSeats, rightSeats) + 2  // +2 for top/bottom rows
    
    // Calculate grid cell dimensions
    const cellWidth = 100 / gridWidth  // Each cell width as percentage
    const cellHeight = 100 / gridHeight  // Each cell height as percentage
    
    // 1. Top row (skip corners) - row 0, columns 1 to gridWidth-2
    for (let i = 0; i < topSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const col = 1 + Math.floor(i * (gridWidth - 2) / topSeats)
      seats.push({
        id: seatId,
        number: seatId,
        position: 'top',
        x: col * cellWidth + cellWidth / 2,  // Center of grid cell
        y: cellHeight / 2,  // Center of top row cell
        status: isAlreadyBooked ? 'booked' : 'available'
      })
      seatId++
    }

    // 2. Right side (skip corners) - column gridWidth-1, rows 1 to gridHeight-2
    for (let i = 0; i < rightSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const row = 1 + Math.floor(i * (gridHeight - 2) / rightSeats)
      seats.push({
        id: seatId,
        number: seatId,
        position: 'right',
        x: (gridWidth - 1) * cellWidth + cellWidth / 2,  // Center of rightmost column cell
        y: row * cellHeight + cellHeight / 2,  // Center of grid cell
        status: isAlreadyBooked ? 'booked' : 'available'
      })
      seatId++
    }

    // 3. Bottom row (skip corners, right to left) - row gridHeight-1, columns gridWidth-2 to 1
    for (let i = 0; i < bottomSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const col = (gridWidth - 2) - Math.floor(i * (gridWidth - 2) / bottomSeats)
      seats.push({
        id: seatId,
        number: seatId,
        position: 'bottom',
        x: col * cellWidth + cellWidth / 2,  // Center of grid cell
        y: (gridHeight - 1) * cellHeight + cellHeight / 2,  // Center of bottom row cell
        status: isAlreadyBooked ? 'booked' : 'available'
      })
      seatId++
    }

    // 4. Left side (skip corners, bottom to top) - column 0, rows gridHeight-2 to 1
    for (let i = 0; i < leftSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const row = (gridHeight - 2) - Math.floor(i * (gridHeight - 2) / leftSeats)
      seats.push({
        id: seatId,
        number: seatId,
        position: 'left',
        x: cellWidth / 2,  // Center of leftmost column cell
        y: row * cellHeight + cellHeight / 2,  // Center of grid cell
        status: isAlreadyBooked ? 'booked' : 'available'
      })
      seatId++
    }
  }

  return seats
}

export default function EventBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = parseInt(params.eventId as string)
  
  // Load event data dynamically
  const [event, setEvent] = useState<any>(null)
  const [pond, setPond] = useState<any>(null)
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
  const [seats, setSeats] = useState<any[]>([])
  const [step, setStep] = useState<'selection' | 'payment'>('selection')
  const [availableSeats, setAvailableSeats] = useState({ available: 0, total: 0 })

  // Load event and pond data on mount
  useEffect(() => {
    const eventData = getEventById(eventId)
    if (eventData) {
      setEvent(eventData)
      const pondData = getPondById(eventData.assignedPonds[0])
      setPond(pondData)
      setAvailableSeats(getEventAvailableSeats(eventId))
      
      // Generate seats based on pond capacity and shape
      if (pondData) {
        const newSeats = generateEventSeats(pondData, eventId, eventData.date)
        setSeats(newSeats)
      }
    }
  }, [eventId])

  // Function to refresh seat data after booking
  const refreshSeats = () => {
    if (event && pond) {
      const newSeats = generateEventSeats(pond, eventId, event.date)
      setSeats(newSeats)
      setAvailableSeats(getEventAvailableSeats(eventId))
    }
  }

  if (!event || !pond) {
    return <div>Event not found</div>
  }

  const handleSeatClick = (seatId: number, status: string) => {
    if (status !== 'available') return
    setSelectedSeat(seatId)
  }

  const handleNext = () => {
    if (selectedSeat) {
      setStep('payment')
    }
  }

  const handlePayment = () => {
    if (!selectedSeat) {
      alert('Please select a seat')
      return
    }

    if (!user) {
      console.error('User not authenticated!')
      alert('Please log in to make a booking')
      router.push('/login')
      return
    }

    const selectedSeatData = seats.find(s => s.id === selectedSeat)
    if (!selectedSeatData) {
      alert('Selected seat not found')
      return
    }

    // Create booking data in the same format as pond booking
    const bookingData = {
      bookingId: `EV${Date.now()}`,
      type: 'event' as const,
      pond: {
        id: event.pondId,
        name: event.pondName,
        image: '🏆' // Event icon
      },
      seats: [{
        id: selectedSeatData.id,
        row: 'E', // Events use 'E' for Event
        number: selectedSeatData.number
      }],
      timeSlot: {
        id: 1,
        time: (event.startTime && event.endTime) ? 
          formatEventTimeRange(event.startTime, event.endTime) : 
          'Tournament Time',
        label: 'Tournament Time'
      },
      date: event.date,
      totalPrice: event.entryFee,
      event: {
        id: event.id,
        name: event.name,
        prize: event.prize
      },
      // Add user information
      userId: user.id,
      userName: user.name,
      userEmail: user.email
    }

    console.log('Event booking data being saved:', bookingData)
    console.log('Selected seat data:', selectedSeatData)
    console.log('Current booked seats before booking:', getBookedSeatsForEvent(eventId, event.date))

    // Save using the enhanced database system for events
    saveEventBookingWithAvailabilityUpdate(bookingData)
    
    // Verify what was actually saved
    const saved = localStorage.getItem('currentBooking')
    console.log('Saved event booking to localStorage:', saved)
    
    // Check if booking was saved properly
    const newBookedSeats = getBookedSeatsForEvent(eventId, event.date)
    console.log('Booked seats after booking:', newBookedSeats)
    
    router.push('/ticket')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/book">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{event.name}</h1>
                <p className="text-xs text-gray-500">{event.pondName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {step === 'selection' && (
          <div className="space-y-4">
            {/* Event Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Date & Time</p>
                      <p className="font-medium">{new Date(event.date).toLocaleDateString('en-GB')}</p>
                      <p className="text-xs text-gray-600">
                        {(event.startTime && event.endTime) ? 
                          formatEventTimeRange(event.startTime, event.endTime) : 
                          'Time TBD'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Entry Fee</p>
                      <p className="font-medium text-green-600">${event.entryFee}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Availability</p>
                      <p className="font-medium">{availableSeats.available}/{availableSeats.total} seats</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Prize</p>
                      <p className="font-medium text-yellow-600">{event.prize}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Select Your Seat</CardTitle>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Booked</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Tournament Pond Layout - Clean design with proper pond positioning */}
                <div className="relative w-full aspect-square max-w-sm mx-auto bg-blue-50 rounded-2xl mb-4">
                  {/* Pond shape positioned based on layout type */}
                  {pond.shape === 'circle' ? (
                    // Circular pond - centered with fixed size
                    <div className="absolute w-32 h-32 bg-blue-200 rounded-full flex items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Fish className="h-10 w-10 text-blue-600" />
                    </div>
                  ) : (
                    // Rectangle/square pond - positioned in the inner grid area
                    <div 
                      className="absolute bg-blue-200 rounded-xl flex items-center justify-center"
                      style={{
                        // Position pond in the inner grid area (excluding seat rows/columns)
                        left: `${100 / (Math.max(pond.seatingArrangement[0], pond.seatingArrangement[2]) + 2)}%`,
                        top: `${100 / (Math.max(pond.seatingArrangement[1], pond.seatingArrangement[3]) + 2)}%`,
                        right: `${100 / (Math.max(pond.seatingArrangement[0], pond.seatingArrangement[2]) + 2)}%`,
                        bottom: `${100 / (Math.max(pond.seatingArrangement[1], pond.seatingArrangement[3]) + 2)}%`
                      }}
                    >
                      <Fish className="h-10 w-10 text-blue-600" />
                    </div>
                  )}

                  {/* Seats around pond - always circular for tournaments */}
                  {seats.map(seat => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat.id, seat.status)}
                      disabled={seat.status !== 'available'}
                      style={{
                        position: 'absolute',
                        left: `${seat.x}%`,
                        top: `${seat.y}%`,
                        transform: `translate(-50%, -50%) ${seat.position === 'circle' ? `rotate(${seat.angle}rad)` : ''}`,
                        transformOrigin: 'center'
                      }}
                      className={`w-8 h-8 ${seat.position === 'circle' ? 'rounded' : 'rounded'} text-xs font-bold transition-all ${
                        selectedSeat === seat.id
                          ? 'bg-blue-500 text-white scale-125 shadow-lg z-20 border-2 border-blue-700'
                          : seat.status === 'available'
                          ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-110 z-10'
                          : 'bg-gray-400 text-white cursor-not-allowed z-10'
                      }`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>

                {selectedSeat && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-sm font-medium text-blue-900">
                      Selected Seat: #{selectedSeat}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      Entry Fee: ${event.entryFee}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={!selectedSeat}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-green-600"
            >
              {selectedSeat ? 'Proceed to Payment' : 'Select a Seat First'}
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium">{event.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pond:</span>
                    <span className="font-medium">{event.pondName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat:</span>
                    <span className="font-medium">#{selectedSeat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(event.date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {(event.startTime && event.endTime) ? 
                        formatEventTimeRange(event.startTime, event.endTime) : 
                        'Time TBD'
                      }
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${event.entryFee}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Demo Payment</p>
                      <p className="text-sm text-gray-600">This is a demo - no actual payment required</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('selection')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
