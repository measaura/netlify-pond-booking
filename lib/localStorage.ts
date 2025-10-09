// Simple local storage database for demo purposes
import { createInitialDatabase } from '@/data/database'
import type {
  Database,
  BookingData,
  Pond,
  TimeSlot,
  Game,
  Prize,
  Event,
  EventGame,
  EventPrize,
  CheckInRecord,
  Notification,
  CatchRecord,
  LeaderboardEntry,
  EventLeaderboard,
  QRValidationResult
} from '@/types'

import {
  defaultGames,
  defaultPrizes,
  defaultPonds,
  defaultEvents,
  defaultEventGames,
} from '@/data/database'


// export interface QRValidationResult {
//   valid: boolean
//   booking?: BookingData
//   checkIn?: CheckInRecord
//   error?: string
//   alreadyCheckedIn?: boolean
//   isExpired?: boolean
//   isWrongDate?: boolean
//   isWrongTime?: boolean
//   isCheckout?: boolean
//   checkInRecord?: CheckInRecord
// }

// export interface Database {
//   bookings: BookingData[]
//   currentBooking: BookingData | null
//   ponds: Pond[]
//   timeSlots: TimeSlot[]
//   events: Event[]
//   checkIns: CheckInRecord[]
//   notifications: Notification[]
//   catches: CatchRecord[]
// }

// Utility function to convert 12-hour format to 24-hour format

const defaultTimeSlots: TimeSlot[] = [
  { id: 1, time: '6:00 AM - 12:00 PM', label: 'Morning Session' },
  { id: 2, time: '12:00 PM - 6:00 PM', label: 'Afternoon Session' },
  { id: 3, time: '6:00 PM - 10:00 PM', label: 'Evening Session' },
]

// const defaultEvents: Event[] = [
//   {
//     id: 1,
//     name: "Bass Masters Cup",
//     date: "2025-09-15T00:00:00.000Z",
//     startTime: "06:00",
//     endTime: "14:00",
//     maxParticipants: 60,
//     assignedPonds: [1],
//     eventGames: [
//       {
//         id: 1,
//         eventId: 1,
//         gameId: 1,
//         prizes: [
//           {
//             id: 1,
//             eventGameId: 1,
//             prizeId: 1,
//             rank: 1
//           },
//           {
//             id: 2,
//             eventGameId: 1,
//             prizeId: 2,
//             rank: 2
//           }
//         ]
//       }
//     ],
//     entryFee: 75,
//     bookingOpens: "2025-09-10T00:00:00.000Z",
//     status: "open"
//   },
//   {
//     id: 2,
//     name: "Trout Tournament",
//     date: "2025-09-22T00:00:00.000Z",
//     startTime: "08:00",
//     endTime: "16:00",
//     maxParticipants: 40,
//     assignedPonds: [2],
//     eventGames: [
//       {
//         id: 2,
//         eventId: 2,
//         gameId: 2,
//         prizes: [
//           {
//             id: 3,
//             eventGameId: 2,
//             prizeId: 1,
//             rank: 1
//           }
//         ]
//       }
//     ],
//     entryFee: 60,
//     bookingOpens: "2025-09-17T00:00:00.000Z",
//     status: "upcoming"
//   },
//   {
//     id: 3,
//     name: "Weekly Championship",
//     date: "2025-09-28T00:00:00.000Z",
//     startTime: "06:00",
//     endTime: "18:00",
//     maxParticipants: 80,
//     assignedPonds: [3],
//     eventGames: [
//       {
//         id: 3,
//         eventId: 3,
//         gameId: 3,
//         prizes: [
//           {
//             id: 4,
//             eventGameId: 3,
//             prizeId: 1,
//             rank: 1
//           }
//         ]
//       }
//     ],
//     entryFee: 100,
//     bookingOpens: "2025-09-23T00:00:00.000Z",
//     status: "upcoming"
//   }
// ]

// Utility function to convert 12-hour format to 24-hour format
export const convertTo24Hour = (time12: string): string => {
  if (!time12 || typeof time12 !== 'string') {
    return '00:00'
  }
  
  const timeStr = time12.trim()
  const isPM = timeStr.toLowerCase().includes('pm')
  const isAM = timeStr.toLowerCase().includes('am')
  
  // Remove AM/PM and clean up
  const timeOnly = timeStr.replace(/\s*(am|pm)\s*/i, '').trim()
  const [hourStr, minuteStr = '00'] = timeOnly.split(':')
  
  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10) || 0
  
  if (isNaN(hour)) return '00:00'
  
  // Convert to 24-hour format
  if (isPM && hour !== 12) {
    hour += 12
  } else if (isAM && hour === 12) {
    hour = 0
  }
  
  // Ensure valid hour range
  hour = Math.max(0, Math.min(23, hour))
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// Utility function to convert 24-hour format to 12-hour format
export const formatTime12Hour = (time24: string): string => {
  // Validate input
  if (!time24 || typeof time24 !== 'string') {
    console.error('Invalid time format provided:', time24)
    return 'Invalid Time'
  }
  
  // Handle various time formats
  const timeStr = time24.trim()
  
  // If it's already in 12-hour format, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr
  }
  
  // Split by colon and validate
  const parts = timeStr.split(':')
  if (parts.length !== 2) {
    console.error('Invalid time format, expected HH:MM:', timeStr)
    return timeStr // Return original if can't parse
  }
  
  const [hoursStr, minutesStr] = parts
  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)
  
  // Validate hours and minutes
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.error('Invalid hour or minute values:', { hours, minutes })
    return timeStr // Return original if invalid
  }
  
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  
  // Ensure minutes are zero-padded
  const paddedMinutes = minutes.toString().padStart(2, '0')
  
  return `${hour12}:${paddedMinutes} ${ampm}`
}

// Utility function to format event time range for display
export const formatEventTimeRange = (startTime: string, endTime: string): string => {
  try {
    return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`
  } catch (error) {
    console.error('Error formatting time range:', { startTime, endTime, error })
    return `${startTime} - ${endTime}` // Fallback to original format
  }
}

// Initialize database
const initDatabase = (): Database => {
  return createInitialDatabase()
}

// Get database from localStorage
export const getDatabase = (): Database => {
  if (typeof window === 'undefined') return initDatabase()
  
  try {
    const data = localStorage.getItem('fishingAppDB')
    if (data) {
      const parsed = JSON.parse(data)
      // Ensure we have the required structure - use defaults if missing
      if (!parsed.ponds || !parsed.timeSlots || !parsed.events || !parsed.notifications || !parsed.bookings || !parsed.catches) {
        const freshData = createInitialDatabase()
        if (!parsed.ponds) parsed.ponds = freshData.ponds
        if (!parsed.timeSlots) parsed.timeSlots = freshData.timeSlots
        if (!parsed.events) parsed.events = freshData.events
        if (!parsed.notifications) parsed.notifications = freshData.notifications
        if (!parsed.bookings) parsed.bookings = freshData.bookings
        if (!parsed.catches) parsed.catches = freshData.catches
      } else {
        // Migrate old events that might have 'time' instead of startTime/endTime
        parsed.events = parsed.events.map((event: any) => {
          if (event.time && (!event.startTime || !event.endTime)) {
            // Convert old time format like "6:00 AM - 2:00 PM" to separate start/end times
            const timeParts = event.time.split(' - ')
            if (timeParts.length === 2) {
              const startTime24 = convertTo24Hour(timeParts[0])
              const endTime24 = convertTo24Hour(timeParts[1])
              return {
                ...event,
                startTime: startTime24,
                endTime: endTime24
              }
            }
          }
          // Ensure we have valid startTime and endTime
          if (!event.startTime || !event.endTime) {
            // Use defaults from the matching default event
            const defaultEvent = defaultEvents.find(de => de.id === event.id)
            if (defaultEvent) {
              event.startTime = defaultEvent.startTime
              event.endTime = defaultEvent.endTime
            }
          }
          return event
        })
      }
      if (!parsed.checkIns) {
        parsed.checkIns = []
      }
      if (!parsed.catches) {
        parsed.catches = []
      }
      return parsed
    }
  } catch (error) {
    console.error('Error reading database:', error)
  }
  return initDatabase()
}

// Save database to localStorage
export const saveDatabase = (db: Database): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('fishingAppDB', JSON.stringify(db))
  } catch (error) {
    console.error('Error saving database:', error)
  }
}

// Export database as JSON for download/backup
export const exportDatabase = (): string => {
  const db = getDatabase()
  return JSON.stringify(db, null, 2)
}

// Import database from JSON string
export const importDatabase = (jsonData: string): boolean => {
  try {
    const importedDb = JSON.parse(jsonData)
    
    // Validate structure
    if (!importedDb.bookings || !importedDb.ponds || !importedDb.timeSlots || !importedDb.events) {
      throw new Error('Invalid database structure')
    }
    
    // Save imported data
    saveDatabase(importedDb)
    return true
  } catch (error) {
    console.error('Error importing database:', error)
    return false
  }
}

// Download database as file
export const downloadDatabase = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    const data = exportDatabase()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `fishing-app-database-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading database:', error)
  }
}

// Save a new booking
export const saveBooking = (bookingData: Omit<BookingData, 'createdAt'>): void => {
  console.log('=== SAVE BOOKING DEBUG ===')
  console.log('Attempting to save booking:', bookingData)
  
  const db = getDatabase()
  console.log('Current database state before save:')
  console.log('- Total bookings:', db.bookings.length)
  console.log('- Existing booking IDs:', db.bookings.map(b => b.bookingId))
  
  const booking: BookingData = {
    ...bookingData,
    createdAt: new Date().toISOString()
  }
  
  console.log('New booking to save:', booking)
  
  // Add to bookings history
  db.bookings.push(booking)
  console.log('After adding booking - Total bookings:', db.bookings.length)
  
  // Set as current booking
  db.currentBooking = booking
  
  // Also save to legacy localStorage for compatibility
  localStorage.setItem('currentBooking', JSON.stringify(booking))
  
  // Save database
  try {
    saveDatabase(db)
    console.log('Database saved to localStorage successfully')
    
    // Verify it was saved
    const verifyDb = getDatabase()
    console.log('Verification - Total bookings after save:', verifyDb.bookings.length)
    console.log('Verification - All booking IDs:', verifyDb.bookings.map(b => b.bookingId))
    
  } catch (error) {
    console.error('Error saving database:', error)
  }
  
  console.log('=== END SAVE BOOKING DEBUG ===')
}

// Get current booking
export const getCurrentBooking = (): BookingData | null => {
  const db = getDatabase()
  return db.currentBooking
}

// Get all bookings
export const getAllBookings = (): BookingData[] => {
  const db = getDatabase()
  console.log('=== GET ALL BOOKINGS DEBUG ===')
  console.log('Total bookings in database:', db.bookings.length)
  console.log('Booking IDs:', db.bookings.map(b => `${b.bookingId} (User: ${b.userId})`))
  console.log('Raw localStorage fishingAppDB length:', localStorage.getItem('fishingAppDB')?.length || 0)
  console.log('=== END GET ALL BOOKINGS DEBUG ===')
  return db.bookings
}

// Clear current booking
export const clearCurrentBooking = (): void => {
  const db = getDatabase()
  db.currentBooking = null
  saveDatabase(db)
  localStorage.removeItem('currentBooking')
}

// Get booking by ID
export const getBookingById = (bookingId: string): BookingData | null => {
  const db = getDatabase()
  return db.bookings.find(b => b.bookingId === bookingId) || null
}

// Force refresh database from localStorage (useful for debugging)
export const refreshDatabase = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    console.log('=== REFRESHING DATABASE ===')
    const rawData = localStorage.getItem('fishingAppDB')
    console.log('Raw localStorage data:', rawData)
    
    if (rawData) {
      const parsed = JSON.parse(rawData)
      console.log('Parsed bookings count:', parsed.bookings?.length || 0)
      console.log('Parsed booking IDs:', parsed.bookings?.map((b: any) => b.bookingId) || [])
    }
    console.log('=== END REFRESH DATABASE ===')
  } catch (error) {
    console.error('Error refreshing database:', error)
  }
}

// Admin functions for demo purposes
export const clearAllBookings = (): void => {
  if (typeof window === 'undefined') return
  
  const db = initDatabase()
  saveDatabase(db)
  localStorage.removeItem('currentBooking')
  console.log('All bookings cleared!')
}

export const deleteBooking = (bookingId: string): boolean => {
  const db = getDatabase()
  const index = db.bookings.findIndex(b => b.bookingId === bookingId)
  
  if (index !== -1) {
    db.bookings.splice(index, 1)
    
    // If this was the current booking, clear it
    if (db.currentBooking?.bookingId === bookingId) {
      db.currentBooking = null
      localStorage.removeItem('currentBooking')
    }
    
    saveDatabase(db)
    console.log(`Booking ${bookingId} deleted!`)
    return true
  }
  
  return false
}

// Get booked seats for a specific pond/event and date
export const getBookedSeats = (pondId: number, date: string, type: 'pond' | 'event' = 'pond', timeSlotId?: number): number[] => {
  const db = getDatabase()
  // Normalize to YYYY-MM-DD format for consistent comparison
  const targetDate = new Date(date).toISOString().split('T')[0]
  
  return db.bookings
    .filter(booking => {
      // Normalize booking date to YYYY-MM-DD format
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      const matchesBasic = booking.pond?.id === pondId && 
                          bookingDate === targetDate && 
                          booking.type === type
      
      // If timeSlotId is provided, filter by time slot as well
      if (timeSlotId !== undefined) {
        return matchesBasic && booking.timeSlot.id === timeSlotId
      }
      
      return matchesBasic
    })
    .flatMap(booking => booking.seats.map(seat => seat.id))
}

// Get booked seats specifically for events
export const getBookedSeatsForEvent = (eventId: number, date: string): number[] => {
  const db = getDatabase()
  // Normalize to YYYY-MM-DD format for consistent comparison
  const targetDate = new Date(date).toISOString().split('T')[0]
  
  return db.bookings
    .filter(booking => {
      // Normalize booking date to YYYY-MM-DD format
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      return booking.type === 'event' && 
             booking.event?.id === eventId && 
             bookingDate === targetDate
    })
    .flatMap(booking => booking.seats.map(seat => seat.id))
}

// POND MANAGEMENT FUNCTIONS

// Get all ponds with updated availability
export const getPonds = (): Pond[] => {
  const db = getDatabase()
  return db.ponds.map(pond => ({
    ...pond,
    available: calculatePondAvailability(pond.id)
  }))
}

// Get pond by ID with updated availability
export const getPondById = (pondId: number): Pond | null => {
  const db = getDatabase()
  const pond = db.ponds.find(p => p.id === pondId)
  if (!pond) return null
  
  return {
    ...pond,
    available: calculatePondAvailability(pondId)
  }
}

// Calculate current availability for a pond across all dates/times
export const calculatePondAvailability = (pondId: number): number => {
  const db = getDatabase()
  const pond = db.ponds.find(p => p.id === pondId)
  if (!pond) return 0
  
  // Calculate total possible seats across all time slots
  const totalTimeSlots = db.timeSlots.length
  const totalPossibleSeats = pond.capacity * totalTimeSlots
  
  // Calculate total booked seats across all dates and time slots
  const totalBookedSeats = db.bookings
    .filter(booking => booking.pond?.id === pondId)
    .reduce((total, booking) => total + booking.seats.length, 0)
  
  return Math.max(0, totalPossibleSeats - totalBookedSeats)
}

// Calculate availability for a specific date
export const calculatePondAvailabilityForDate = (pondId: number, date: string): number => {
  const db = getDatabase()
  const pond = db.ponds.find(p => p.id === pondId)
  if (!pond) return 0
  
  // Normalize to YYYY-MM-DD format for consistent comparison
  const targetDate = new Date(date).toISOString().split('T')[0]
  const totalTimeSlots = db.timeSlots.length
  const totalPossibleSeatsForDate = pond.capacity * totalTimeSlots
  
  // Calculate booked seats for the specific date across all time slots
  const bookedSeatsForDate = db.bookings
    .filter(booking => {
      // Normalize booking date to YYYY-MM-DD format
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      return booking.pond?.id === pondId && bookingDate === targetDate
    })
    .reduce((total, booking) => total + booking.seats.length, 0)
  
  return Math.max(0, totalPossibleSeatsForDate - bookedSeatsForDate)
}

// Update pond availability (called after bookings)
export const updatePondAvailability = (pondId: number): void => {
  const db = getDatabase()
  const pondIndex = db.ponds.findIndex(p => p.id === pondId)
  if (pondIndex !== -1) {
    db.ponds[pondIndex].available = calculatePondAvailability(pondId)
    saveDatabase(db)
  }
}

// TIME SLOT MANAGEMENT FUNCTIONS

// Get all time slots
export const getTimeSlots = (): TimeSlot[] => {
  const db = getDatabase()
  return db.timeSlots
}

// Get time slot by ID
export const getTimeSlotById = (timeSlotId: number): TimeSlot | null => {
  const db = getDatabase()
  return db.timeSlots.find(ts => ts.id === timeSlotId) || null
}

// Check time slot availability for a specific pond and date
export const getTimeSlotAvailability = (pondId: number, timeSlotId: number, date: string): boolean => {
  const db = getDatabase()
  const pond = db.ponds.find(p => p.id === pondId)
  if (!pond) return false
  
  // Normalize to YYYY-MM-DD format for consistent comparison
  const targetDate = new Date(date).toISOString().split('T')[0]
  
  const bookedSeats = db.bookings
    .filter(booking => {
      // Normalize booking date to YYYY-MM-DD format
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      return booking.pond?.id === pondId && 
             booking.timeSlot.id === timeSlotId &&
             bookingDate === targetDate
    })
    .reduce((total, booking) => total + booking.seats.length, 0)
  
  return bookedSeats < pond.capacity
}

// Get available seats count for a specific time slot and date
export const getTimeSlotAvailableSeats = (pondId: number, timeSlotId: number, date: string): { available: number; total: number } => {
  const db = getDatabase()
  const pond = db.ponds.find(p => p.id === pondId)
  if (!pond) return { available: 0, total: 0 }
  
  // Normalize the target date - handle both ISO strings and date strings
  const targetDate = new Date(date).toISOString().split('T')[0]
  
  const bookedSeats = db.bookings
    .filter(booking => {
      // Normalize booking date to YYYY-MM-DD format
      const bookingDate = new Date(booking.date).toISOString().split('T')[0]
      return booking.pond?.id === pondId && 
             booking.timeSlot.id === timeSlotId &&
             bookingDate === targetDate
    })
    .reduce((total, booking) => total + booking.seats.length, 0)
  
  return {
    available: Math.max(0, pond.capacity - bookedSeats),
    total: pond.capacity
  }
}

// ENHANCED BOOKING FUNCTIONS

// Enhanced save booking that updates pond availability
export const saveBookingWithAvailabilityUpdate = (bookingData: Omit<BookingData, 'createdAt'>): void => {
  // Save the booking
  saveBooking(bookingData)
  
  // Update pond availability
  updatePondAvailability(bookingData.pond.id)
}

// ADMIN/RESET FUNCTIONS

// Reset database to defaults (useful for development)
export const resetDatabase = (): void => {
  if (typeof window === 'undefined') return
  
  const freshDb = createInitialDatabase()
  saveDatabase(freshDb)
  localStorage.removeItem('currentBooking')
  
  console.log('Database reset to defaults!')
  console.log('Pond capacities per slot:', freshDb.ponds.map(p => `${p.name}: ${p.capacity} seats/slot`))
  console.log('Total time slots:', freshDb.timeSlots.length)
  console.log('Total capacity per pond:', freshDb.ponds.map(p => `${p.name}: ${p.capacity * freshDb.timeSlots.length} total seats`))
  console.log('Events with times:', freshDb.events.map(e => `${e.name}: ${e.startTime} - ${e.endTime}`))
  console.log('Sample bookings created:', freshDb.bookings.length)
  console.log('Sample check-ins created:', freshDb.checkIns.length)
}

// Recalculate all pond availabilities (useful for data consistency)
export const recalculateAllAvailabilities = (): void => {
  const db = getDatabase()
  db.ponds.forEach(pond => {
    pond.available = calculatePondAvailability(pond.id)
  })
  saveDatabase(db)
}

// EVENT MANAGEMENT FUNCTIONS

// Get all events
export const getEvents = (): (Event & { participants: number })[] => {
  const db = getDatabase()
  return db.events.map(event => ({
    ...event,
    // Add dynamic participant count based on bookings
    participants: getEventParticipantCount(event.id)
  }))
}

// Get event by ID
export const getEventById = (eventId: number): (Event & { participants: number }) | null => {
  const db = getDatabase()
  const event = db.events.find(e => e.id === eventId)
  if (!event) return null
  
  return {
    ...event,
    participants: getEventParticipantCount(eventId)
  }
}

// Get current participant count for an event
export const getEventParticipantCount = (eventId: number): number => {
  const db = getDatabase()
  return db.bookings
    .filter(booking => booking.type === 'event' && booking.event?.id === eventId)
    .length
}

// Get available seats for an event
export const getEventAvailableSeats = (eventId: number): { available: number; total: number } => {
  const db = getDatabase()
  const event = db.events.find(e => e.id === eventId)
  if (!event) return { available: 0, total: 0 }
  
  const participants = getEventParticipantCount(eventId)
  
  return {
    available: Math.max(0, event.maxParticipants - participants),
    total: event.maxParticipants
  }
}

// Check if event booking is open
export const isEventBookingOpen = (eventId: number): boolean => {
  const db = getDatabase()
  const event = db.events.find(e => e.id === eventId)
  if (!event) return false
  
  const now = new Date()
  const bookingOpenDate = new Date(event.bookingOpens)
  const eventDate = new Date(event.date)
  
  // Booking is open if:
  // 1. Current date is after booking open date
  // 2. Current date is before event date
  // 3. Event status is 'open'
  // 4. Event is not full
  const participants = getEventParticipantCount(eventId)
  
  return now >= bookingOpenDate && 
         now < eventDate && 
         event.status === 'open' && 
         participants < event.maxParticipants
}

// Get event status
export const getEventStatus = (eventId: number): 'open' | 'upcoming' | 'full' | 'closed' => {
  const db = getDatabase()
  const event = db.events.find(e => e.id === eventId)
  if (!event) return 'closed'
  
  const now = new Date()
  const bookingOpenDate = new Date(event.bookingOpens)
  const eventDate = new Date(event.date)
  const participants = getEventParticipantCount(eventId)
  
  // Event has passed
  if (now > eventDate) return 'closed'
  
  // Event is full
  if (participants >= event.maxParticipants) return 'full'
  
  // Booking hasn't opened yet
  if (now < bookingOpenDate) return 'upcoming'
  
  // Booking is open
  return 'open'
}

// Enhanced save booking that updates event availability  
export const saveEventBookingWithAvailabilityUpdate = (bookingData: Omit<BookingData, 'createdAt'>): void => {
  // Save the booking
  saveBooking(bookingData)
  
  // Update availability for all assigned ponds
  if (bookingData.event?.id) {
    const event = getEventById(bookingData.event.id)
    event?.assignedPonds.forEach(pondId => {
      updatePondAvailability(pondId)
    })
  }
}

// Create sample bookings for demo/testing purposes
export const createSampleBookings = (): void => {
  const db = getDatabase()
  
  // Only create samples if no bookings exist
  if (db.bookings.length > 0) {
    console.log('Sample bookings already exist')
    return
  }
  
  const sampleBookings: BookingData[] = [
    {
      bookingId: 'FG1726243800000',
      type: 'pond',
      pond: {
        id: 1,
        name: "Emerald Lake",
        image: "🌊"
      },
      seats: [
        { id: 1, row: 'A', number: 1 },
        { id: 2, row: 'A', number: 2 }
      ],
      timeSlot: {
        id: 1,
        time: '6:00 AM - 12:00 PM',
        label: 'Morning Session'
      },
      date: '2025-09-15',
      totalPrice: 100,
      createdAt: new Date('2025-09-10T10:30:00Z').toISOString(),
      userId: 1,
      userName: 'John Doe',
      userEmail: 'user1@fishing.com'
    },
    {
      bookingId: 'FG1726157400000',
      type: 'event',
      pond: {
        id: 1,
        name: "Emerald Lake",
        image: "🌊"
      },
      event: {
        id: 1,
        name: "Bass Masters Cup",
        prize: "$2,500"
      },
      seats: [
        { id: 15, row: 'C', number: 15 }
      ],
      timeSlot: {
        id: 1,
        time: '6:00 AM - 2:00 PM',
        label: 'Competition Session'
      },
      date: '2025-09-15',
      totalPrice: 75,
      createdAt: new Date('2025-09-08T14:20:00Z').toISOString(),
      userId: 2,
      userName: 'Jane Smith',
      userEmail: 'user2@fishing.com'
    },
    {
      bookingId: 'FG1726186200000',
      type: 'pond',
      pond: {
        id: 3,
        name: "Silver Basin",
        image: "🏔️"
      },
      seats: [
        { id: 8, row: 'B', number: 8 }
      ],
      timeSlot: {
        id: 2,
        time: '12:00 PM - 6:00 PM',
        label: 'Afternoon Session'
      },
      date: '2025-09-20',
      totalPrice: 40,
      createdAt: new Date('2025-09-09T16:45:00Z').toISOString(),
      userId: 3,
      userName: 'Mike Johnson',
      userEmail: 'user3@fishing.com'
    },
    {
      bookingId: 'FG1725702900000',
      type: 'pond',
      pond: {
        id: 4,
        name: "Crystal Pond",
        image: "💎"
      },
      seats: [
        { id: 5, row: 'A', number: 5 },
        { id: 6, row: 'A', number: 6 }
      ],
      timeSlot: {
        id: 3,
        time: '6:00 PM - 10:00 PM',
        label: 'Evening Session'
      },
      date: '2025-09-12',
      totalPrice: 110,
      createdAt: new Date('2025-09-07T09:15:00Z').toISOString(),
      userId: 1,
      userName: 'John Doe',
      userEmail: 'user1@fishing.com'
    }
  ]
  
  // Add sample bookings to database
  db.bookings.push(...sampleBookings)
  saveDatabase(db)
  
  console.log('Sample bookings created:', sampleBookings.length)
  console.log('Sample booking IDs:', sampleBookings.map(b => b.bookingId))
}

// Create sample check-ins for demo/testing purposes
export const createSampleCheckIns = (): void => {
  const db = getDatabase()
  
  // Only create samples if no check-ins exist
  if (db.checkIns.length > 0) {
    console.log('Sample check-ins already exist')
    return
  }
  
  const sampleCheckIns: CheckInRecord[] = [
    {
      id: 'CHECK-001',
      bookingId: 'FG1726243800000',
      pond: {
        id: 1,
        name: "Emerald Lake"
      },
      seats: [
        { id: 1, row: 'A', number: 1 },
        { id: 2, row: 'A', number: 2 }
      ],
      checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      timeSlot: {
        id: 1,
        time: '6:00 AM - 12:00 PM',
        label: 'Morning Session'
      },
      date: new Date().toISOString().split('T')[0],
      status: 'checked-in',
      scannedBy: 'pond.manager@gmail.com',
      type: 'pond'
    },
    {
      id: 'CHECK-002',
      bookingId: 'FG1726186200000',
      pond: {
        id: 3,
        name: "Silver Basin"
      },
      seats: [
        { id: 8, row: 'B', number: 8 }
      ],
      checkInTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      checkOutTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      timeSlot: {
        id: 2,
        time: '12:00 PM - 6:00 PM',
        label: 'Afternoon Session'
      },
      date: new Date().toISOString().split('T')[0],
      status: 'checked-out',
      scannedBy: 'pond.manager@gmail.com',
      type: 'pond'
    },
    {
      id: 'CHECK-003',
      bookingId: 'FG1726157400000',
      pond: {
        id: 1,
        name: "Emerald Lake"
      },
      seats: [
        { id: 15, row: 'C', number: 15 }
      ],
      checkInTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      timeSlot: {
        id: 1,
        time: '6:00 AM - 2:00 PM',
        label: 'Competition Session'
      },
      date: new Date().toISOString().split('T')[0],
      status: 'checked-in',
      scannedBy: 'pond.admin@gmail.com',
      type: 'event',
      event: {
        id: 1,
        name: "Bass Masters Cup",
        prize: "$2,500"
      }
    }
  ]
  
  // Add sample check-ins to database
  db.checkIns.push(...sampleCheckIns)
  saveDatabase(db)
  
  console.log('Sample check-ins created:', sampleCheckIns.length)
  console.log('Sample check-in IDs:', sampleCheckIns.map(c => c.id))
}

// QR CODE VALIDATION AND CHECK-IN FUNCTIONS

// Validate QR code data and return validation result
export const validateQRCode = (qrData: string, scannedBy: string): QRValidationResult => {
  try {
    const parsedData = JSON.parse(qrData)
    
    // Check if QR data has required fields
    if (!parsedData.bookingId) {
      return { valid: false, error: 'Invalid QR code format: missing booking ID' }
    }
    
    // Find the booking in database
    const db = getDatabase()
    console.log('Validation - Looking for booking:', parsedData.bookingId)
    console.log('Validation - Available bookings:', db.bookings.map(b => ({
      id: b.bookingId,
      date: b.date,
      type: b.type,
      pond: b.pond?.name
    })))
    
    const booking = db.bookings.find(b => b.bookingId === parsedData.bookingId)
    console.log('Validation - Found booking:', booking ? {
      id: booking.bookingId,
      date: booking.date,
      pond: booking.pond?.name
    } : 'NOT FOUND')
    
    if (!booking) {
      return { valid: false, error: 'Booking not found' }
    }
    
    // Check if booking date matches today
    const bookingDate = new Date(booking.date).toDateString()
    const today = new Date().toDateString()
    const isToday = bookingDate === today
    
    // For stricter validation: only allow check-in on the exact booking date
    if (!isToday) {
      return { 
        valid: false, 
        error: `Booking is for ${new Date(booking.date).toLocaleDateString('en-GB')}, not today (${new Date().toLocaleDateString('en-GB')})`,
        isWrongDate: true,
        booking 
      }
    }
    
    // Time slot validation - check if current time is within the booked time slot
    if (booking.timeSlot && booking.timeSlot.time) {
      const currentTime = new Date()
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()
      const currentTotalMinutes = currentHour * 60 + currentMinute
      
      // Parse time slot (e.g., "09:00-12:00")
      const timeRange = booking.timeSlot.time.split('-')
      if (timeRange.length === 2) {
        const startTime = timeRange[0].trim()
        const endTime = timeRange[1].trim()
        
        // Parse start time
        const [startHour, startMin] = startTime.split(':').map(Number)
        const startTotalMinutes = startHour * 60 + startMin
        
        // Parse end time
        const [endHour, endMin] = endTime.split(':').map(Number)
        const endTotalMinutes = endHour * 60 + endMin
        
        // Allow check-in 15 minutes before start time and until end time
        const checkInWindowStart = startTotalMinutes - 15 // 15 minutes early
        const checkInWindowEnd = endTotalMinutes
        
        console.log('Time validation:', {
          currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
          bookingTimeSlot: booking.timeSlot.time,
          currentTotalMinutes,
          checkInWindowStart,
          checkInWindowEnd,
          isWithinWindow: currentTotalMinutes >= checkInWindowStart && currentTotalMinutes <= checkInWindowEnd
        })
        
        if (currentTotalMinutes < checkInWindowStart || currentTotalMinutes > checkInWindowEnd) {
          const startTimeFormatted = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
          const endTimeFormatted = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
          const currentTimeFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
          
          if (currentTotalMinutes < checkInWindowStart) {
            return {
              valid: false,
              error: `Too early for check-in. Booking time: ${booking.timeSlot.time}. Check-in opens at ${(startHour === 0 && startMin < 15) ? '23:45' : `${Math.floor(checkInWindowStart / 60).toString().padStart(2, '0')}:${(checkInWindowStart % 60).toString().padStart(2, '0')}`} (15 min before). Current time: ${currentTimeFormatted}`,
              isWrongTime: true,
              booking
            }
          } else {
            return {
              valid: false,
              error: `Too late for check-in. Booking time: ${booking.timeSlot.time}. Check-in closed at ${endTimeFormatted}. Current time: ${currentTimeFormatted}`,
              isWrongTime: true,
              booking
            }
          }
        }
      }
    }
    
    // Check if already checked in
    const existingCheckIn = db.checkIns.find(c => 
      c.bookingId === booking.bookingId && 
      c.status === 'checked-in'
    )

    if (existingCheckIn) {
      return {
        valid: true,
        booking,
        checkIn: existingCheckIn,
        alreadyCheckedIn: true,
        error: 'Already checked in'
      }
    }
    
    // Valid QR code
    return { valid: true, booking }
    
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format: unable to parse data' }
  }
}

// Check in a user based on validated QR code
export const checkInUser = (booking: BookingData, scannedBy: string, notes?: string): CheckInRecord => {
  const db = getDatabase()
  
  // Create check-in record
  const checkInRecord: CheckInRecord = {
    id: `CHECK-${Date.now()}`,
    bookingId: booking.bookingId,
    userName: booking.userName,
    userEmail: booking.userEmail,
    pond: booking.pond,
    seats: booking.seats,
    checkInTime: new Date().toISOString(),
    timeSlot: booking.timeSlot,
    date: booking.date,
    status: 'checked-in',
    scannedBy,
    type: booking.type,
    event: booking.event,
    notes
  }
  
  // Add to database
  db.checkIns.push(checkInRecord)
  saveDatabase(db)
  
  return checkInRecord
}

// Check out a user
export const checkOutUser = (checkInId: string, scannedBy: string): boolean => {
  const db = getDatabase()
  const checkInIndex = db.checkIns.findIndex(c => c.id === checkInId)
  
  if (checkInIndex !== -1) {
    db.checkIns[checkInIndex].checkOutTime = new Date().toISOString()
    db.checkIns[checkInIndex].status = 'checked-out'
    saveDatabase(db)
    return true
  }
  
  return false
}

// Validate QR code for checkout - returns the check-in record if valid
export const validateQRCodeForCheckout = (qrData: string, scannedBy: string): QRValidationResult & { checkInRecord?: CheckInRecord } => {
  try {
    const parsedData = JSON.parse(qrData)
    
    // Check if QR data has required fields
    if (!parsedData.bookingId) {
      return { valid: false, error: 'Invalid QR code format: missing booking ID' }
    }
    
    // Find the booking in database
    const db = getDatabase()
    const booking = db.bookings.find(b => b.bookingId === parsedData.bookingId)
    
    if (!booking) {
      return { valid: false, error: 'Booking not found' }
    }
    
    // Find the active check-in record for this booking
    const checkInRecord = db.checkIns.find(c => 
      c.bookingId === booking.bookingId && 
      c.status === 'checked-in'
    )
    
    if (!checkInRecord) {
      return { 
        valid: false, 
        error: 'User is not currently checked in',
        booking 
      }
    }
    
    // Valid QR code for checkout
    return { 
      valid: true, 
      booking,
      checkInRecord,
      isCheckout: true
    }
    
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' }
  }
}

// Get all check-ins for today
export const getTodayCheckIns = (): CheckInRecord[] => {
  const db = getDatabase()
  const today = new Date().toDateString()
  
  return db.checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.checkInTime).toDateString()
    return checkInDate === today
  }).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
}

// Get check-ins by pond
export const getCheckInsByPond = (pondId: number): CheckInRecord[] => {
  const db = getDatabase()
  return db.checkIns.filter(c => c.pond.id === pondId && c.status === 'checked-in')
}

// Get current occupancy for a pond
export const getPondCurrentOccupancy = (pondId: number): { current: number; capacity: number; percentage: number } => {
  const checkedInUsers = getCheckInsByPond(pondId)
  const pond = getPondById(pondId)
  const capacity = pond?.capacity || 0
  const current = checkedInUsers.length
  const percentage = capacity > 0 ? Math.round((current / capacity) * 100) : 0
  
  return { current, capacity, percentage }
}

// Get all current check-ins across all ponds
export const getAllCurrentCheckIns = (): CheckInRecord[] => {
  const db = getDatabase()
  return db.checkIns.filter(c => c.status === 'checked-in')
}

// Get check-in statistics for dashboard
export const getCheckInStats = (): {
  totalToday: number
  currentlyCheckedIn: number
  totalCheckOuts: number
  noShows: number
} => {
  const todayCheckIns = getTodayCheckIns()
  const currentlyCheckedIn = getAllCurrentCheckIns().length
  const totalCheckOuts = todayCheckIns.filter(c => c.status === 'checked-out').length
  const noShows = todayCheckIns.filter(c => c.status === 'no-show').length
  
  return {
    totalToday: todayCheckIns.length,
    currentlyCheckedIn,
    totalCheckOuts,
    noShows
  }
}

// Mark user as no-show
export const markAsNoShow = (bookingId: string): boolean => {
  const db = getDatabase()
  const booking = db.bookings.find(b => b.bookingId === bookingId)
  
  if (!booking) return false
  
  // Check if already has a check-in record
  const existingCheckIn = db.checkIns.find(c => c.bookingId === bookingId)
  if (existingCheckIn) {
    existingCheckIn.status = 'no-show'
  } else {
    // Create a no-show record
    const noShowRecord: CheckInRecord = {
      id: `NOSHOW-${Date.now()}`,
      bookingId: booking.bookingId,
      pond: booking.pond,
      seats: booking.seats,
      checkInTime: new Date().toISOString(),
      timeSlot: booking.timeSlot,
      date: booking.date,
      status: 'no-show',
      scannedBy: 'system',
      type: booking.type,
      event: booking.event,
      notes: 'Marked as no-show'
    }
    db.checkIns.push(noShowRecord)
  }
  
  saveDatabase(db)
  return true
}

// =======================
// Notification Management
// =======================


// Get all notifications for a user
export const getUserNotifications = (userId: number): Notification[] => {
  const db = getDatabase()
  return db.notifications.filter(n => n.userId === userId)
}

// Get unread notifications count for a user  
export const getUnreadNotificationCount = (userId: number): number => {
  const db = getDatabase()
  return db.notifications.filter(n => n.userId === userId && !n.isRead).length
}

// Mark notification as read
export const markNotificationAsRead = (notificationId: number): boolean => {
  const db = getDatabase()
  const notification = db.notifications.find(n => n.id === notificationId)
  
  if (notification) {
    notification.isRead = true
    saveDatabase(db)
    return true
  }
  
  return false
}

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = (userId: number): boolean => {
  const db = getDatabase()
  const userNotifications = db.notifications.filter(n => n.userId === userId)
  
  userNotifications.forEach(n => {
    n.isRead = true
  })
  
  saveDatabase(db)
  return true
}

// Delete notification
export const deleteNotification = (notificationId: number): boolean => {
  const db = getDatabase()
  const index = db.notifications.findIndex(n => n.id === notificationId)
  
  if (index !== -1) {
    db.notifications.splice(index, 1)
    saveDatabase(db)
    return true
  }
  
  return false
}

// Add new notification
export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): number => {
  const db = getDatabase()
  const newNotification: Notification = {
    ...notification,
    id: Date.now(),
    createdAt: new Date().toISOString()
  }
  
  db.notifications.push(newNotification)
  saveDatabase(db)
  return newNotification.id
}

// Get high priority notifications for a user
export const getHighPriorityNotifications = (userId: number): Notification[] => {
  const db = getDatabase()
  return db.notifications.filter(n => 
    n.userId === userId && 
    n.priority === 'high' && 
    !n.isRead
  )
}

// =======================
// POND CRUD OPERATIONS
// =======================

// Add new pond
export const addPond = (pondData: Omit<Pond, 'id' | 'available'>): Pond => {
  const db = getDatabase()
  const newPond: Pond = {
    ...pondData,
    id: Math.max(0, ...db.ponds.map(p => p.id)) + 1,
    available: pondData.capacity // Initially fully available
  }
  
  db.ponds.push(newPond)
  saveDatabase(db)
  return newPond
}

// Update existing pond
export const updatePond = (pondId: number, updatedData: Partial<Omit<Pond, 'id' | 'available'>>): boolean => {
  const db = getDatabase()
  const pondIndex = db.ponds.findIndex(p => p.id === pondId)
  
  if (pondIndex !== -1) {
    // Update pond data
    db.ponds[pondIndex] = {
      ...db.ponds[pondIndex],
      ...updatedData
    }
    
    // Recalculate availability based on current bookings
    db.ponds[pondIndex].available = calculatePondAvailability(pondId)
    
    saveDatabase(db)
    return true
  }
  
  return false
}

// Delete pond (only if no bookings exist)
export const deletePond = (pondId: number): { success: boolean; error?: string } => {
  const db = getDatabase()
  
  // Check if pond has any bookings
  const hasBookings = db.bookings.some(b => b.pond?.id === pondId)
  if (hasBookings) {
    return {
      success: false,
      error: 'Cannot delete pond with existing bookings. Please cancel all bookings first.'
    }
  }
  
  // Check if pond is used in any events
  const hasEvents = db.events.some(e => e.assignedPonds.includes(pondId)) // Updated this line
  if (hasEvents) {
    return {
      success: false,
      error: 'Cannot delete pond that is used in events. Please remove from events first.'
    }
  }
  
  const pondIndex = db.ponds.findIndex(p => p.id === pondId)
  if (pondIndex !== -1) {
    db.ponds.splice(pondIndex, 1)
    saveDatabase(db)
    return { success: true }
  }
  
  return { success: false, error: 'Pond not found.' }
}

// Toggle pond booking status
export const togglePondBooking = (pondId: number): boolean => {
  const db = getDatabase()
  const pondIndex = db.ponds.findIndex(p => p.id === pondId)
  
  if (pondIndex !== -1) {
    db.ponds[pondIndex].bookingEnabled = !db.ponds[pondIndex].bookingEnabled
    saveDatabase(db)
    return true
  }
  
  return false
}

// Get ponds with booking statistics
export const getPondsWithStats = (): (Pond & { 
  totalBookings: number; 
  currentOccupancy: number;
  revenue: number;
})[] => {
  const db = getDatabase()
  return db.ponds.map(pond => {
    const totalBookings = db.bookings.filter(b => b.pond?.id === pond.id).length
    const currentOccupancy = getCheckInsByPond(pond.id).length
    const revenue = db.bookings
      .filter(b => b.pond?.id === pond.id)
      .reduce((sum, b) => sum + b.totalPrice, 0)
    
    return {
      ...pond,
      available: calculatePondAvailability(pond.id),
      totalBookings,
      currentOccupancy,
      revenue
    }
  })
}

// =======================
// EVENT CRUD OPERATIONS
// =======================

// Add new event
export const addEvent = (eventData: Omit<Event, 'id'>): Event => {
  const db = getDatabase()
  const newEvent: Event = {
    ...eventData,
    id: Math.max(0, ...db.events.map(e => e.id)) + 1
  }
  
  db.events.push(newEvent)
  saveDatabase(db)
  return newEvent
}

// Update existing event
export const updateEvent = (eventId: number, updatedData: Partial<Omit<Event, 'id'>>): boolean => {
  const db = getDatabase()
  const eventIndex = db.events.findIndex(e => e.id === eventId)
  
  if (eventIndex !== -1) {
    // Remove any pondId/pondName references from updatedData
    const { pondId, pondName, ...cleanedData } = updatedData as any
    
    db.events[eventIndex] = {
      ...db.events[eventIndex],
      ...cleanedData
    }
    
    saveDatabase(db)
    return true
  }
  
  return false
}

// Delete event (only if no bookings exist)
export const deleteEvent = (eventId: number): { success: boolean; error?: string } => {
  const db = getDatabase()
  
  // Check if event has any bookings
  const hasBookings = db.bookings.some(b => b.event?.id === eventId)
  if (hasBookings) {
    return {
      success: false,
      error: 'Cannot delete event with existing bookings. Please cancel all bookings first.'
    }
  }
  
  const eventIndex = db.events.findIndex(e => e.id === eventId)
  if (eventIndex !== -1) {
    db.events.splice(eventIndex, 1)
    saveDatabase(db)
    return { success: true }
  }
  
  return { success: false, error: 'Event not found.' }
}

// Toggle event status
export const updateEventStatus = (eventId: number, status: 'open' | 'upcoming' | 'closed'): boolean => {
  const db = getDatabase()
  const eventIndex = db.events.findIndex(e => e.id === eventId)
  
  if (eventIndex !== -1) {
    db.events[eventIndex].status = status
    saveDatabase(db)
    return true
  }
  
  return false
}

// Get events with booking statistics
export const getEventsWithStats = (): (Event & {
  participants: number;
  revenue: number;
  availableSpots: number;
  bookingOpenIn?: number;
  eventIn?: number;
})[] => {
  const db = getDatabase()
  const now = new Date()
  
  return db.events.map(event => {
    const participants = getEventParticipantCount(event.id)
    const revenue = db.bookings
      .filter(b => b.event?.id === event.id)
      .reduce((sum, b) => sum + b.totalPrice, 0)
    const availableSpots = event.maxParticipants - participants
    
    const bookingOpenDate = new Date(event.bookingOpens)
    const eventDate = new Date(event.date)
    
    const bookingOpenIn = bookingOpenDate > now ? 
      Math.ceil((bookingOpenDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined
    
    const eventIn = eventDate > now ? 
      Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined
    
    return {
      ...event,
      participants,
      revenue,
      availableSpots,
      bookingOpenIn,
      eventIn
    }
  })
}

// Get upcoming events (next 30 days)
export const getUpcomingEvents = (): (Event & { participants: number })[] => {
  const db = getDatabase()
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  return db.events
    .filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= thirtyDaysLater
    })
    .map(event => ({
      ...event,
      participants: getEventParticipantCount(event.id)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Cancel all bookings for a pond (admin function)
export const cancelAllPondBookings = (pondId: number): number => {
  const db = getDatabase()
  const bookingsToCancel = db.bookings.filter(b => b.pond?.id === pondId)
  const canceledCount = bookingsToCancel.length
  
  // Remove all bookings for this pond
  db.bookings = db.bookings.filter(b => b.pond?.id !== pondId)
  
  // Remove related check-ins
  db.checkIns = db.checkIns.filter(c => c.pond.id !== pondId)
  
  // Recalculate pond availability
  const pondIndex = db.ponds.findIndex(p => p.id === pondId)
  if (pondIndex !== -1) {
    db.ponds[pondIndex].available = calculatePondAvailability(pondId)
  }
  
  saveDatabase(db)
  return canceledCount
}

// Cancel all bookings for an event (admin function)
export const cancelAllEventBookings = (eventId: number): number => {
  const db = getDatabase()
  const bookingsToCancel = db.bookings.filter(b => b.event?.id === eventId)
  const canceledCount = bookingsToCancel.length
  
  // Remove all bookings for this event
  db.bookings = db.bookings.filter(b => b.event?.id !== eventId)
  
  // Remove related check-ins
  db.checkIns = db.checkIns.filter(c => c.event?.id !== eventId)
  
  saveDatabase(db)
  return canceledCount
}

// Leaderboard Functions
export function recordCatch(catchData: Omit<CatchRecord, 'id' | 'recordedAt'>): CatchRecord {
  console.log('=== RECORDING CATCH ===')
  console.log('catchData:', catchData)
  console.log('eventId:', catchData.eventId)
  console.log('eventName:', catchData.eventName)
  console.log('userId:', catchData.userId)
  console.log('=====================')

  const db = getDatabase()
  
  // Ensure catches array exists
  if (!db.catches) {
    db.catches = []
  }
  
  const newCatch: CatchRecord = {
    ...catchData,
    id: Math.max(0, ...db.catches.map(c => c.id)) + 1,
    recordedAt: new Date().toISOString()
  }
  
  console.log('=== SAVED CATCH ===')
  console.log('newCatch:', newCatch)
  console.log('==================')
  
  db.catches.push(newCatch)
  saveDatabase(db)
  return newCatch
}

export function getCatches(): CatchRecord[] {
  const db = getDatabase()
  return db.catches || []
}

export function setCatches(catches: CatchRecord[]): void {
  const db = getDatabase()
  db.catches = catches
  saveDatabase(db)
}

export function getCatchesByUser(userId: number): CatchRecord[] {
  const catches = getCatches()
  return catches.filter(catchRecord => catchRecord.userId === userId)
}

export function getUserParticipatedEvents(userId: number): Event[] {
  const userCatches = getCatchesByUser(userId)
  const eventIds = [...new Set(userCatches.map(catchRecord => catchRecord.eventId))]
  const allEvents = getEvents()
  
  return allEvents.filter(event => eventIds.includes(event.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
}

export function getCatchesByEvent(eventId: number): CatchRecord[] {
  const catches = getCatches()
  console.log('=== GET CATCHES BY EVENT ===')
  console.log('eventId:', eventId)
  console.log('all catches:', catches)
  console.log('filtering catches by eventId...')
  
  const eventCatches = catches.filter(catchRecord => {
    console.log(`  catch ${catchRecord.id}: eventId=${catchRecord.eventId}, matches=${catchRecord.eventId === eventId}`)
    return catchRecord.eventId === eventId
  })
  
  console.log('filtered catches:', eventCatches)
  console.log('============================')
  
  return eventCatches
}

export function generateEventLeaderboard(eventId: number): EventLeaderboard {
  console.log('=== GENERATING EVENT LEADERBOARD ===')
  console.log('eventId:', eventId)
  
  const catches = getCatchesByEvent(eventId)
  console.log('catches for event:', catches)
  console.log('total catches found:', catches.length)
  
  const events = getEvents()
  const event = events.find(e => e.id === eventId)
  
  console.log('event found:', event)
  console.log('===================================')
  
  if (!event) {
    throw new Error(`Event with ID ${eventId} not found`)
  }

  const userStats: { [userId: number]: {
    userId: number
    userName: string
    userEmail: string
    totalWeight: number
    totalFish: number
    biggestFish: number
  }} = {}

  // Calculate stats for each user
  catches.forEach(catchRecord => {
    const userId = catchRecord.userId
    
    if (!userStats[userId]) {
      userStats[userId] = {
        userId,
        userName: catchRecord.userName,
        userEmail: catchRecord.userEmail,
        totalWeight: 0,
        totalFish: 0,
        biggestFish: 0
      }
    }
    
    userStats[userId].totalWeight += catchRecord.fishWeight
    userStats[userId].totalFish += 1
    userStats[userId].biggestFish = Math.max(userStats[userId].biggestFish, catchRecord.fishWeight)
  })

  // Convert to leaderboard entries and calculate rankings
  const entries: LeaderboardEntry[] = Object.values(userStats).map(stats => ({
    ...stats,
    gameId: event.games[0]?.id || 0,
    value: stats.totalWeight,
    timestamp: new Date().toISOString(),
    averageWeight: stats.totalFish > 0 ? stats.totalWeight / stats.totalFish : 0,
    competitionsParticipated: 1, // This specific event
    competitionsWon: 0, // Will be set after ranking
    rank: 0, // Will be set after sorting
    points: Math.round(stats.totalWeight * 100) // 100 points per kg
  }))

  // Sort by total weight (heaviest first) and assign ranks
  entries.sort((a, b) => {
    if (b.totalWeight !== a.totalWeight) {
      return b.totalWeight - a.totalWeight
    }
    // If same total weight, sort by biggest fish
    if (b.biggestFish !== a.biggestFish) {
      return b.biggestFish - a.biggestFish
    }
    // If still tied, sort by total fish count
    return b.totalFish - a.totalFish
  })

  entries.forEach((entry, index) => {
    entry.rank = index + 1
    if (entry.rank === 1) {
      entry.competitionsWon = 1
    }
  })

  return {
    eventId,
    eventName: event.name,
    gameId: event.games[0]?.id || 0,
    entries,
    lastUpdated: new Date().toISOString()
  }
}

export function generateOverallLeaderboard(): LeaderboardEntry[] {
  const catches = getCatches()
  const userStats: { [userId: number]: {
    userId: number
    userName: string
    userEmail: string
    lastGameId: number
    lastCatchTimestamp: string
    totalWeight: number
    totalFish: number
    biggestFish: number
    eventIds: Set<number>
    firstPlaces: number
  }} = {}

  // Calculate overall stats for each user
  catches.forEach(catchRecord => {
    const userId = catchRecord.userId
    
    if (!userStats[userId]) {
      userStats[userId] = {
        userId,
        userName: catchRecord.userName,
        userEmail: catchRecord.userEmail,
        lastGameId: catchRecord.gameId,
        lastCatchTimestamp: catchRecord.recordedAt,
        totalWeight: 0,
        totalFish: 0,
        biggestFish: 0,
        eventIds: new Set(),
        firstPlaces: 0
      }
    }
    
    userStats[userId].totalWeight += catchRecord.fishWeight
    userStats[userId].totalFish += 1
    userStats[userId].biggestFish = Math.max(userStats[userId].biggestFish, catchRecord.fishWeight)
    
    if (catchRecord.eventId) {
      userStats[userId].eventIds.add(catchRecord.eventId)
    }
  })

  // Calculate first places for each user
  const events = getEvents()
  events.forEach(event => {
    try {
      const eventLeaderboard = generateEventLeaderboard(event.id)
      if (eventLeaderboard.entries.length > 0) {
        const winner = eventLeaderboard.entries[0]
        if (userStats[winner.userId]) {
          userStats[winner.userId].firstPlaces++
        }
      }
    } catch (error) {
      // Event might not have catches yet
    }
  })

  // Convert to leaderboard entries
  const entries: LeaderboardEntry[] = Object.values(userStats).map(stats => ({
    userId: stats.userId,
    userName: stats.userName,
    userEmail: stats.userEmail,
    gameId: stats.lastGameId,           // Use the most recent game ID
    value: stats.totalWeight,           // Total weight as the value
    timestamp: stats.lastCatchTimestamp, // Use most recent catch timestamp

    totalWeight: stats.totalWeight,
    totalFish: stats.totalFish,
    biggestFish: stats.biggestFish,
    averageWeight: stats.totalFish > 0 ? stats.totalWeight / stats.totalFish : 0,
    competitionsParticipated: stats.eventIds.size,
    competitionsWon: stats.firstPlaces,
    rank: 0, // Will be set after sorting
    points: Math.round(stats.totalWeight * 100 + stats.firstPlaces * 500) // 100 points per kg + 500 bonus per win
  }))

  // Sort and assign ranks
  entries.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    if (b.totalWeight !== a.totalWeight) {
      return b.totalWeight - a.totalWeight
    }
    return b.biggestFish - a.biggestFish
  })

  entries.forEach((entry, index) => {
    entry.rank = index + 1
  })

  return entries
}

export function getUserLeaderboardStats(userId: number): LeaderboardEntry | null {
  const overallLeaderboard = generateOverallLeaderboard()
  return overallLeaderboard.find(entry => entry.userId === userId) || null
}

// Add new functions for games management
export const getGames = (): Game[] => {
  const db = getDatabase()
  return db.games
}

export const addGame = (game: Omit<Game, 'id'>): Game => {
  const db = getDatabase()
  const newGame = {
    ...game,
    id: Math.max(0, ...db.games.map(g => g.id)) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.games.push(newGame)
  saveDatabase(db)
  return newGame
}

// Add game management functions
export const updateGame = (gameId: number, updatedData: Partial<Omit<Game, 'id' | 'createdAt' | 'updatedAt'>>): boolean => {
  const db = getDatabase()
  const gameIndex = db.games.findIndex(g => g.id === gameId)
  
  if (gameIndex !== -1) {
    db.games[gameIndex] = {
      ...db.games[gameIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    }
    saveDatabase(db)
    return true
  }
  return false
}

export const deleteGame = (gameId: number): boolean => {
  const db = getDatabase()
  const gameIndex = db.games.findIndex(g => g.id === gameId)
  
  // Check if game is used in any events
  const isUsedInEvents = db.eventGames.some(eg => eg.gameId === gameId)
  if (isUsedInEvents) {
    throw new Error('Cannot delete game that is used in events')
  }
  
  if (gameIndex !== -1) {
    db.games.splice(gameIndex, 1)
    saveDatabase(db)
    return true
  }
  return false
}

// Add new functions for prizes management
export const getPrizes = (): Prize[] => {
  const db = getDatabase()
  return db.prizes
}

export const addPrize = (prize: Omit<Prize, 'id'>): Prize => {
  const db = getDatabase()
  const newPrize = {
    ...prize,
    id: Math.max(0, ...db.prizes.map(p => p.id)) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.prizes.push(newPrize)
  saveDatabase(db)
  return newPrize
}

export const updatePrize = (prizeId: number, updatedData: Partial<Omit<Prize, 'id' | 'createdAt' | 'updatedAt'>>): boolean => {
  const db = getDatabase()
  const prizeIndex = db.prizes.findIndex(p => p.id === prizeId)
  
  if (prizeIndex !== -1) {
    db.prizes[prizeIndex] = {
      ...db.prizes[prizeIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    }
    saveDatabase(db)
    return true
  }
  return false
}

export const deletePrize = (prizeId: number): boolean => {
  const db = getDatabase()
  const prizeIndex = db.prizes.findIndex(p => p.id === prizeId)
  
  // Check if prize is used in any events
  const isUsedInEvents = db.eventPrizes.some(ep => ep.prizeId === prizeId)
  if (isUsedInEvents) {
    throw new Error('Cannot delete prize that is used in events')
  }
  
  if (prizeIndex !== -1) {
    db.prizes.splice(prizeIndex, 1)
    saveDatabase(db)
    return true
  }
  return false
}
