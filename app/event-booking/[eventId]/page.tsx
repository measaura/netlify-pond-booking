'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, DollarSign, Fish, Trophy, CreditCard } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { formatEventTimeRange } from "@/lib/localStorage"
import { useAuth } from '@/lib/auth'
import { useToastSafe } from '@/components/ui/toast'

// Generate seats based on pond shape and seating arrangement for events
const generateEventSeats = (pond: any, eventId: number, eventDate: string, eventOccupied: number[] | null = null) => {
  if (!pond) return []
  
  const seats = []
  
  // Get already booked seats for this specific event (injected)
  const bookedSeatIds = eventOccupied ?? []

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
    // Rectangle or square arrangement - counter-clockwise from top-left
    // Order: Top (left to right) → Left (top to bottom) → Bottom (left to right) → Right (bottom to top)
    const [topSeats, rightSeats, bottomSeats, leftSeats] = seatingArrangement
    
    // Create a grid: width = max(top, bottom) + 2, height = max(left, right) + 2
    const gridWidth = Math.max(topSeats, bottomSeats) + 2  // +2 for side columns
    const gridHeight = Math.max(leftSeats, rightSeats) + 2  // +2 for top/bottom rows
    
    // Calculate grid cell dimensions
    const cellWidth = 100 / gridWidth  // Each cell width as percentage
    const cellHeight = 100 / gridHeight  // Each cell height as percentage
    
    // 1. Top row (left to right) - row 0, columns 1 to gridWidth-2
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

    // 2. Left side (top to bottom) - column 0, rows 1 to gridHeight-2
    for (let i = 0; i < leftSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const row = 1 + Math.floor(i * (gridHeight - 2) / leftSeats)
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

    // 3. Bottom row (left to right) - row gridHeight-1, columns 1 to gridWidth-2
    for (let i = 0; i < bottomSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const col = 1 + Math.floor(i * (gridWidth - 2) / bottomSeats)
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

    // 4. Right side (bottom to top) - column gridWidth-1, rows gridHeight-2 to 1
    for (let i = 0; i < rightSeats; i++) {
      const isAlreadyBooked = bookedSeatIds.includes(seatId)
      const row = (gridHeight - 2) - Math.floor(i * (gridHeight - 2) / rightSeats)
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
  }

  return seats
}

export default function EventBookingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = parseInt(params.eventId as string)
  const toast = useToastSafe()
  
  // Load event data dynamically
  const [event, setEvent] = useState<any>(null)
  const [availablePonds, setAvailablePonds] = useState<any[]>([])
  const [selectedPondId, setSelectedPondId] = useState<number | null>(null)
  const [pond, setPond] = useState<any>(null)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [seats, setSeats] = useState<any[]>([])
  const [step, setStep] = useState<'pond' | 'seats' | 'payment'>('pond')
  const [availableSeats, setAvailableSeats] = useState({ available: 0, total: 0 })

  const [eventOccupied, setEventOccupied] = useState<number[] | null>(null)

  // Load event and ponds data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const eventsRes = await fetch('/api/events')
        const eventsJson = await eventsRes.json()
        const events = eventsJson.data || eventsJson
        const eventData = events.find((e: any) => e.id === eventId) ?? null
        if (!eventData) return
        setEvent(eventData)

        // Fetch all ponds assigned to this event
        const pondsRes = await fetch('/api/ponds')
        const pondsJson = await pondsRes.json()
        const allPonds = pondsJson.data || pondsJson
        const assignedPondIds = eventData.assignedPonds || []
        const eventPonds = allPonds.filter((p: any) => assignedPondIds.includes(p.id))
        setAvailablePonds(eventPonds)

        // If only one pond, auto-select it
        if (eventPonds.length === 1) {
          setSelectedPondId(eventPonds[0].id)
          setPond(eventPonds[0])
          setStep('seats')
        }
      } catch (err) {
        console.error('Failed to load event/pond data', err)
      }
    }

    load()
  }, [eventId])

  // Load pond seats when pond is selected
  useEffect(() => {
    if (!selectedPondId || !event) return

    const loadPondSeats = async () => {
      try {
        const selectedPond = availablePonds.find((p: any) => p.id === selectedPondId)
        if (!selectedPond) return
        setPond(selectedPond)

        // Fetch occupied seats for this event/date/pond
        const occRes = await fetch(`/api/bookings/occupied?eventId=${eventId}&pondId=${selectedPondId}&date=${encodeURIComponent(event.date)}`)
        const occJson = await occRes.json()
        const occupied = (occJson && occJson.data && Array.isArray(occJson.data.occupied)) ? occJson.data.occupied : []
        setEventOccupied(occupied)

        // Available seats: derive from pond capacity minus occupied
        const total = selectedPond.capacity || selectedPond.maxCapacity || 0
        const avail = Math.max(0, total - occupied.length)
        setAvailableSeats({ available: avail, total })
        const newSeats = generateEventSeats(selectedPond, eventId, event.date, occupied)
        setSeats(newSeats)
      } catch (err) {
        console.error('Failed to load pond seats', err)
      }
    }

    loadPondSeats()
  }, [selectedPondId, event, eventId, availablePonds])

  // Function to refresh seat data after booking
  const refreshSeats = async () => {
    if (!event || !pond) return
    try {
      const occRes = await fetch(`/api/bookings/occupied?eventId=${eventId}&date=${encodeURIComponent(event.date)}`)
      const occJson = await occRes.json()
  const occupied = (occJson && occJson.data && Array.isArray(occJson.data.occupied)) ? occJson.data.occupied : []
  setEventOccupied(occupied)
      const total = pond.capacity || 0
      setAvailableSeats({ available: Math.max(0, total - occupied.length), total })
  const newSeats = generateEventSeats(pond, eventId, event.date, occupied)
      setSeats(newSeats)
    } catch (err) {
      console.error('Failed to refresh seats', err)
    }
  }

  // Only check for event - pond is optional during pond selection step
  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  // For seats and payment steps, we need pond selected
  if ((step === 'seats' || step === 'payment') && !pond) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading pond data...</p>
        </div>
      </div>
    )
  }

  const handleSeatClick = (seatId: number, status: string) => {
    if (status !== 'available') return
    
    // Check if already selected - toggle off
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId))
      return
    }
    
    // Check max seats per booking limit
    const maxSeats = event?.maxSeatsPerBooking || 1
    if (selectedSeats.length >= maxSeats) {
      toast ? toast.push({ 
        message: `Maximum ${maxSeats} seat${maxSeats > 1 ? 's' : ''} per booking`, 
        variant: 'error' 
      }) : window.alert(`Maximum ${maxSeats} seat${maxSeats > 1 ? 's' : ''} per booking`)
      return
    }
    
    // Add to selection
    setSelectedSeats(prev => [...prev, seatId])
  }

  const handlePondSelect = (pondId: number) => {
    setSelectedPondId(pondId)
    setSelectedSeats([]) // Reset seat selection
    setStep('seats')
  }

  const handleNext = () => {
    if (step === 'seats' && selectedSeats.length > 0) {
      setStep('payment')
    }
  }

  const handleBack = () => {
    if (step === 'payment') {
      setStep('seats')
    } else if (step === 'seats' && availablePonds.length > 1) {
      setStep('pond')
      setSelectedSeats([])
    }
  }

  const handlePayment = async () => {
    if (selectedSeats.length === 0) {
      toast ? toast.push({ message: 'Please select at least one seat', variant: 'error' }) : window.alert('Please select at least one seat')
      return
    }

    if (!pond || !selectedPondId) {
      toast ? toast.push({ message: 'Please select a pond first', variant: 'error' }) : window.alert('Please select a pond first')
      return
    }

    if (!user) {
      console.error('User not authenticated!')
      toast ? toast.push({ message: 'Please log in to make a booking', variant: 'error' }) : window.alert('Please log in to make a booking')
      router.push('/login')
      return
    }

    // Fetch real database user ID from email
    let dbUserId: number
    try {
      const userRes = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`)
      const userJson = await userRes.json()
      if (!userJson.ok || !userJson.data?.id) {
        toast ? toast.push({ message: 'Failed to verify user account', variant: 'error' }) : window.alert('Failed to verify user account')
        return
      }
      dbUserId = userJson.data.id
      console.log('Database user ID:', dbUserId)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      toast ? toast.push({ message: 'Failed to verify user account', variant: 'error' }) : window.alert('Failed to verify user account')
      return
    }

    // Get all selected seats data
    const selectedSeatsData = selectedSeats
      .map(seatId => seats.find(s => s.id === seatId))
      .filter((seat): seat is NonNullable<typeof seat> => seat !== undefined)

    if (selectedSeatsData.length === 0) {
      toast ? toast.push({ message: 'Selected seats not found', variant: 'error' }) : window.alert('Selected seats not found')
      return
    }

    // Construct payload expected by server
    const payload = {
      type: 'event',
      eventId: event.id,
      pondId: selectedPondId,
      seats: selectedSeatsData.map(seat => ({ number: seat.number, row: 'E' })),
      date: event.date,
      totalPrice: event.entryFee * selectedSeats.length,
      bookedByUserId: dbUserId
    }

    console.log('Creating event booking with payload:', payload)
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      console.log('Booking API response status:', res.status)
      
      if (!res.ok) {
        const text = await res.text()
        console.error('Booking API error response:', text)
        toast ? toast.push({ message: `Failed to create booking: ${text}`, variant: 'error' }) : window.alert(`Failed to create booking: ${text}`)
        return
      }
      
      const json = await res.json()
      console.log('Booking API response:', json)
      
      const bookingData = json.data || json
      const bookingId = bookingData.bookingId || bookingData.id || bookingData.booking?.id
      
      console.log('Extracted bookingId:', bookingId)
      
      if (!bookingId) {
        console.error('No bookingId in response:', json)
        toast ? toast.push({ message: 'Booking created but no id returned', variant: 'error' }) : window.alert('Booking created but no id returned')
        return
      }
      
      console.log('Booking successful! Redirecting to ticket page...')
      
      // Refresh seats and navigate
      await refreshSeats()
      router.push(`/ticket?booking=${bookingId}`)
    } catch (err: any) {
      console.error('Failed to save event booking:', err)
      const errorMsg = err?.message || 'Unknown error'
      toast ? toast.push({ message: `Failed to create booking: ${errorMsg}`, variant: 'error' }) : window.alert(`Failed to create booking: ${errorMsg}`)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
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
                <p className="text-xs text-gray-500">{pond?.name || (availablePonds.length > 0 ? `${availablePonds.length} ponds available` : 'Loading...')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 flex-1 flex flex-col overflow-hidden">
        {/* Pond Selection Step */}
        {step === 'pond' && availablePonds.length > 1 && (
          <div className="flex-1 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Select a Pond</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availablePonds.map((pondOption: any) => (
                  <button
                    key={pondOption.id}
                    onClick={() => handlePondSelect(pondOption.id)}
                    className="w-full p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{pondOption.image || '🌊'}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{pondOption.name}</h3>
                        <p className="text-sm text-gray-600">Capacity: {pondOption.capacity || pondOption.maxCapacity} seats</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seat Selection Step */}
        {step === 'seats' && pond && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Fixed Event Info at top */}
            <Card className="flex-shrink-0 mb-4">
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

            {/* Scrollable Seat Selection */}
            <div className="flex-1 overflow-y-auto min-h-0 mb-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-lg">Select Your Seat</CardTitle>
                  <div className="flex justify-center gap-4 text-xs mt-2">
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
                <CardContent className="p-4">
                {/* Grid-based seat layout for mobile */}
                {pond.shape?.toLowerCase() === 'circle' ? (
                  // Circular layout - simple grid of all seats
                  <div className="space-y-4">
                    <div className="text-center bg-blue-200 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
                      <Fish className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat.id, seat.status)}
                          disabled={seat.status !== 'available'}
                          className={`h-14 rounded-lg text-sm font-bold transition-all touch-manipulation ${
                            selectedSeats.includes(seat.id)
                              ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-700'
                              : seat.status === 'available'
                              ? 'bg-green-500 text-white active:scale-95'
                              : 'bg-gray-400 text-white cursor-not-allowed'
                          }`}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Rectangle layout - seats arranged around pond
                  <div className="space-y-4">
                    {/* Top row - horizontal */}
                    {pond.seatingArrangement[0] > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {seats.filter(s => s.position === 'top').map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat.id, seat.status)}
                            disabled={seat.status !== 'available'}
                            className={`w-12 h-12 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                              selectedSeats.includes(seat.id)
                                ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-700'
                                : seat.status === 'available'
                                ? 'bg-green-500 text-white active:scale-95'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Middle section: Left seats | Pond | Right seats */}
                    <div className="flex gap-2 items-stretch">
                      {/* Left seats - vertical column (seats 1-100, top to bottom) */}
                      {pond.seatingArrangement[3] > 0 && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {seats.filter(s => s.position === 'left').sort((a, b) => a.number - b.number).map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat.id, seat.status)}
                              disabled={seat.status !== 'available'}
                              className={`w-12 h-12 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                                selectedSeats.includes(seat.id)
                                  ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-700'
                                  : seat.status === 'available'
                                  ? 'bg-green-500 text-white active:scale-95'
                                  : 'bg-gray-400 text-white cursor-not-allowed'
                              }`}
                            >
                              {seat.number}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Pond in center - height matches seats */}
                      <div className="flex-1 bg-blue-200 rounded-xl flex items-center justify-center" style={{
                        minHeight: '100%'
                      }}>
                        <Fish className="h-12 w-12 text-blue-600" />
                      </div>

                      {/* Right seats - vertical column (seats 101-200, bottom to top for counter-clockwise) */}
                      {pond.seatingArrangement[1] > 0 && (
                        <div className="flex flex-col-reverse gap-2 flex-shrink-0">
                          {seats.filter(s => s.position === 'right').sort((a, b) => a.number - b.number).map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat.id, seat.status)}
                              disabled={seat.status !== 'available'}
                              className={`w-12 h-12 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                                selectedSeats.includes(seat.id)
                                  ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-700'
                                  : seat.status === 'available'
                                  ? 'bg-green-500 text-white active:scale-95'
                                  : 'bg-gray-400 text-white cursor-not-allowed'
                              }`}
                            >
                              {seat.number}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom row - horizontal */}
                    {pond.seatingArrangement[2] > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {seats.filter(s => s.position === 'bottom').map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat.id, seat.status)}
                            disabled={seat.status !== 'available'}
                            className={`w-12 h-12 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                              selectedSeats.includes(seat.id)
                                ? 'bg-blue-500 text-white shadow-lg border-2 border-blue-700'
                                : seat.status === 'available'
                                ? 'bg-green-500 text-white active:scale-95'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Fixed Bottom Section */}
            <div className="flex-shrink-0 space-y-3 pb-4">
              {/* Selected seats summary */}
              {selectedSeats.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">
                    Selected Seat{selectedSeats.length > 1 ? 's' : ''}: #{selectedSeats.join(', #')}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    Total: ${event.entryFee * selectedSeats.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Max {event.maxSeatsPerBooking || 1} seat{(event.maxSeatsPerBooking || 1) > 1 ? 's' : ''} per booking
                  </div>
                </div>
              )}

              {/* Next Button */}
              <Button
                onClick={handleNext}
                disabled={selectedSeats.length === 0}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-green-600"
              >
                {selectedSeats.length > 0 ? 'Proceed to Payment' : 'Select a Seat First'}
              </Button>
            </div>
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
                    <span className="font-medium">{pond?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat{selectedSeats.length > 1 ? 's' : ''}:</span>
                    <span className="font-medium">#{selectedSeats.join(', #')}</span>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-medium">${event.entryFee} × {selectedSeats.length}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${event.entryFee * selectedSeats.length}</span>
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
                onClick={handleBack}
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
