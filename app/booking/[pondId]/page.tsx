'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleCalendar } from "@/components/ui/simple-calendar"
import { ArrowLeft, Clock, Users, DollarSign, Fish, MapPin, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { 
  saveBookingWithAvailabilityUpdate, 
  getBookedSeats, 
  getPondById, 
  getTimeSlots, 
  getTimeSlotAvailability,
  getTimeSlotAvailableSeats,
  getCurrentBooking
} from "@/lib/localStorage"
import type { Pond, TimeSlot } from '@/types'
import { useAuth } from '@/lib/auth'

// Generate seats based on pond shape and seating arrangement
const generateSeats = (pond: Pond, selectedDate?: Date, timeSlotId?: number) => {
  if (!pond) return []

  // Get already booked seats for this pond, date, and time slot
  const bookedSeatIds = selectedDate && timeSlotId ? 
    getBookedSeats(pond.id, selectedDate.toISOString(), 'pond', timeSlotId) : []

  const seats = []
  let seatId = 1

  // Ensure pond has shape and seatingArrangement (backward compatibility)
  const shape = pond.shape || 'rectangle'
  const seatingArrangement = pond.seatingArrangement || [3, 3, 3, 3] // default arrangement

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

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const pondId = parseInt(params.pondId as string)
  
  // Dynamic state for database data
  const [pond, setPond] = useState<Pond | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [seats, setSeats] = useState<any[]>([])
  const [step, setStep] = useState<'date' | 'time' | 'seats' | 'payment'>('date')

  // Generate seats only when we have date and time slot
  useEffect(() => {
    if (selectedDate && selectedTimeSlot && pond) {
      const newSeats = generateSeats(pond, selectedDate, selectedTimeSlot)
      setSeats(newSeats)
      setSelectedSeats([]) // Clear selected seats when date/time changes
    }
  }, [selectedDate, selectedTimeSlot, pondId])

  // Load pond and timeSlots data on component mount
  useEffect(() => {
    const loadData = () => {
      const pondData = getPondById(pondId)
      const timeSlotsData = getTimeSlots()
      
      setPond(pondData)
      setTimeSlots(timeSlotsData)
    }
    
    loadData()
  }, [pondId])

  // Check availability for each time slot based on selected date
  const checkTimeSlotAvailability = (timeSlotId: number) => {
    if (!selectedDate || !pond) return true
    return getTimeSlotAvailability(pond.id, timeSlotId, selectedDate.toISOString())
  }

  if (!pond) {
    return <div>Pond not found</div>
  }

  const handleSeatClick = (seatId: number, status: string) => {
    if (status !== 'available') return

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    )
  }

  const handleNext = () => {
    if (step === 'date' && selectedDate) {
      setStep('time')
    } else if (step === 'time' && selectedTimeSlot) {
      setStep('seats')
    } else if (step === 'seats' && selectedSeats.length > 0) {
      setStep('payment')
    }
  }

  const handleBack = () => {
    if (step === 'payment') {
      setStep('seats')
    } else if (step === 'seats') {
      setStep('time')
    } else if (step === 'time') {
      setStep('date')
    }
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0 || !selectedTimeSlot || !selectedDate) {
      alert('Please complete all selections')
      return
    }

    if (!pond) {
      console.error('Pond not found! PondId:', pondId)
      alert('Error: Pond not found')
      return
    }

    if (!user) {
      console.error('User not authenticated!')
      alert('Please log in to make a booking')
      router.push('/login')
      return
    }

    // Get the selected time slot
    const selectedTimeSlotData = timeSlots.find(t => t.id === selectedTimeSlot)
    if (!selectedTimeSlotData) {
      console.error('Time slot not found! Selected ID:', selectedTimeSlot, 'Available slots:', timeSlots)
      alert('Error: Time slot not found')
      return
    }

    // Get the selected seats data (filter out undefined)
    const selectedSeatsData = selectedSeats
      .map(seatId => seats.find(s => s.id === seatId))
      .filter((seat): seat is NonNullable<typeof seat> => seat !== undefined)
      .map(seat => ({
        id: seat.id,
        row: seat.position || '', // Use position as row identifier
        number: seat.number
      }))

    if (selectedSeatsData.length === 0) {
      console.error('Seats not found! Selected IDs:', selectedSeats, 'Available seats:', seats)
      alert('Error: Seats not found')
      return
    }

    // Store booking data with proper validation
    const bookingData = {
      bookingId: `FG${Date.now()}`,
      type: 'pond' as const,
      pond: {
        id: pond.id,
        name: pond.name,
        image: pond.image
      },
      seats: selectedSeatsData,
      timeSlot: {
        id: selectedTimeSlotData.id,
        time: selectedTimeSlotData.time,
        label: selectedTimeSlotData.label
      },
      date: selectedDate.toISOString(),
      totalPrice: selectedSeats.length * pond.price,
      // Add user information
      userId: user.id,
      userName: user.name,
      userEmail: user.email
    }

    console.log('=== BOOKING SAVE DEBUG ===')
    console.log('Pond booking data being saved:', bookingData)

    // Save using the enhanced database system that updates availability
    saveBookingWithAvailabilityUpdate(bookingData)
    
    // Debug: Check if booking was saved correctly
    setTimeout(() => {
      const savedBooking = getCurrentBooking()
      console.log('Saved booking retrieved:', savedBooking)
      console.log('Booking seats in saved data:', savedBooking?.seats)
      console.log('=== END BOOKING SAVE DEBUG ===')
    }, 100)
    
    // Navigate to ticket page with booking ID
    router.push(`/ticket?booking=${bookingData.bookingId}`)
  }

  const totalPrice = selectedSeats.length * pond.price

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
              <div className="text-2xl">{pond.image}</div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{pond.name}</h1>
                <p className="text-xs text-gray-500">
                  {step === 'date' && 'Select date'}
                  {step === 'time' && 'Choose time slot'}
                  {step === 'seats' && 'Choose your seats'}
                  {step === 'payment' && 'Confirm booking'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'date' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>1</div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'time' ? 'bg-blue-500 text-white' : 
              (step === 'seats' || step === 'payment') ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'seats' ? 'bg-blue-500 text-white' : 
              step === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
            }`}>3</div>
            <div className="w-8 h-1 bg-gray-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'payment' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>4</div>
          </div>
        </div>

        {/* Step 1: Date Selection */}
        {step === 'date' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleCalendar
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date: Date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>

            <Button 
              onClick={handleNext} 
              disabled={!selectedDate}
              className="w-full h-12"
            >
              Continue to Time Selection
            </Button>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 'time' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Time Slot</CardTitle>
                <p className="text-sm text-gray-600">
                  Date: {selectedDate?.toLocaleDateString('en-GB')}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeSlots.map((slot) => {
                  const isAvailable = checkTimeSlotAvailability(slot.id)
                  const availableSeatsResult = selectedDate ? 
                    getTimeSlotAvailableSeats(pond.id, slot.id, selectedDate.toISOString()) : 
                    pond.capacity
                  
                  const availableSeats = typeof availableSeatsResult === 'number' 
                    ? availableSeatsResult 
                    : availableSeatsResult.available

                  return (
                    <div
                      key={slot.id}
                      onClick={() => isAvailable && setSelectedTimeSlot(slot.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTimeSlot === slot.id
                          ? 'border-blue-500 bg-blue-50'
                          : isAvailable
                          ? 'border-gray-200 hover:border-blue-300'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{slot.time}</p>
                          <p className="text-sm text-gray-600">{slot.label}</p>
                        </div>
                        {isAvailable ? (
                          <div className="text-green-600 text-sm">{availableSeats} available</div>
                        ) : (
                          <div className="text-red-600 text-sm">Full</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Button 
              onClick={handleNext} 
              disabled={!selectedTimeSlot}
              className="w-full h-12"
            >
              Continue to Seat Selection
            </Button>
          </div>
        )}

        {/* Step 3: Seat Selection */}
        {step === 'seats' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Choose Your Seats</CardTitle>
                <div className="text-center text-sm text-gray-600">
                  {selectedDate?.toLocaleDateString('en-GB')} • {timeSlots.find(t => t.id === selectedTimeSlot)?.time}
                </div>
                <div className="flex justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Booked</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Pond Layout */}
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
                  
                  {/* Seats positioned around pond based on shape and arrangement */}
                  {seats.map((seat) => (
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
                        selectedSeats.includes(seat.id)
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

                {selectedSeats.length > 0 && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium">Selected: {selectedSeats.length} seat(s)</p>
                    <p className="text-lg font-bold text-blue-600">£{totalPrice}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={selectedSeats.length === 0}
                className="flex-1"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Payment Confirmation */}
        {step === 'payment' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pond:</span>
                  <span className="font-medium">{pond.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{timeSlots.find(t => t.id === selectedTimeSlot)?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-medium">
                    {selectedSeats.map(seatId => {
                      const seat = seats.find(s => s.id === seatId)
                      return seat ? seat.number.toString() : ''
                    }).join(', ')}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">£{totalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Demo Payment</p>
                      <p className="text-sm text-gray-600">This is a demo - no actual payment required</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleBooking} className="flex-1">
                Complete Booking
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
