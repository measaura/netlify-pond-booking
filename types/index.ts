// Base interfaces for core data

export interface User {
  id: number
  name: string
  email: string
  password: string
  role: 'user' | 'manager' | 'admin'
  isActive: boolean
  createdAt: string
}

export interface BookingData {
  bookingId: string
  type: 'pond' | 'event'
  pond: {
    id: number
    name: string
    image: string
  }
  seats: Array<{
    id: number
    row: string
    number: number
  }>
  timeSlot: {
    id: number
    time: string
    label?: string
  }
  date: string
  totalPrice: number
  createdAt: string
  
  // User information
  userId: number
  userName: string
  userEmail: string
  
  // Event-specific fields
  event?: {
    id: number
    name: string
    prize?: string
  }
  games?: Array<{
    id: number
    name: string
    type: 'heaviest' | 'nearest' | 'biggest' | 'other'
  }>
}

export interface Pond {
  id: number
  name: string
  // Primary numeric capacity value used across the UI. Many UI components still
  // reference `capacity`, so keep it required for compatibility. The database
  // schema uses `maxCapacity`, which is kept as an optional alias here.
  capacity: number
  maxCapacity?: number // Maximum seating capacity (renamed from capacity)
  // Current availability snapshot (optional, computed server-side)
  available?: number
  price: number
  image: string
  bookingEnabled: boolean // Whether booking is currently allowed
  shape: 'rectangle' | 'square' | 'circle'
  seatingArrangement: any // JSON field - can be array or object
}

export interface TimeSlot {
  id: number
  time: string
  label: string
}

export interface Game {
  id: number
  name: string
  type: 'heaviest' | 'nearest' | 'biggest' | 'other'
  targetValue?: number
  measurementUnit: 'kg' | 'cm' | 'other'
  decimalPlaces?: number
  description: string
  prizes: Prize[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Prize {
  id: number
  name: string
  type: 'money' | 'item'
  value: number
  rank?: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventGame {
  id: number
  eventId: number
  gameId: number
  prizes: EventPrize[]
}

export interface EventPrize {
  id: number
  eventGameId: number
  prizeId: number
  rank: number
}

export interface Event {
  id: number
  name: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  assignedPonds: number[] // Array of pond IDs
  games: Game[]
  entryFee: number
  bookingOpens: string
  status: 'open' | 'upcoming' | 'closed' | 'active' | 'completed'
}

export interface CheckInRecord {
  id: string
  bookingId: string
  userId?: string
  userName?: string
  userEmail?: string
  pond: {
    id: number
    name: string
  }
  seats: Array<{
    id: number
    row: string
    number: number
  }>
  checkInTime: string
  checkOutTime?: string
  timeSlot: {
    id: number
    time: string
    label?: string
  }
  date: string
  status: 'checked-in' | 'checked-out' | 'no-show'
  scannedBy: string // Staff member who scanned
  type: 'pond' | 'event'
  event?: {
    id: number
    name: string
    prize?: string
  }
  notes?: string
}

export interface CatchRecord {
  id: number
  userId: number
  userName: string
  userEmail: string
  bookingId: string
  eventId?: number
  eventName?: string
  pondId: number
  pondName: string
  gameId: number
  weight?: number
  length?: number
  fishWeight: number // in kg
  fishLength?: number // in cm (optional)
  fishSpecies?: string // optional
  catchTime: string // ISO timestamp
  timestamp: string
  recordedBy: string // Manager who recorded the catch
  recordedAt: string // When it was recorded
  isVerified: boolean // For future smart scale integration
  verified: boolean
  photo?: string
  notes?: string
}


export interface LeaderboardEntry {
  userId: number
  userName: string
  userEmail: string
  gameId: number
  value: number
  timestamp: string
  totalWeight: number
  totalFish: number
  biggestFish: number
  averageWeight: number
  competitionsParticipated: number
  competitionsWon: number
  rank: number
  points: number // Competition points based on placement
}

export interface EventLeaderboard {
  eventId: number
  eventName: string
  gameId: number
  entries: LeaderboardEntry[]
  lastUpdated: string
}

export interface QRValidationResult {
  valid: boolean
  booking?: BookingData
  checkIn?: CheckInRecord
  error?: string
  alreadyCheckedIn?: boolean
  isExpired?: boolean
  isWrongDate?: boolean
  isWrongTime?: boolean
  isCheckout?: boolean
  checkInRecord?: CheckInRecord
}

export interface Game {
  id: number
  name: string
  type: 'heaviest' | 'nearest' | 'biggest' | 'other'
  targetValue?: number
  measurementUnit: 'kg' | 'cm' | 'other'
  decimalPlaces?: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Prize {
  id: number
  name: string
  type: 'money' | 'item'
  value: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventGame {
  id: number
  eventId: number
  gameId: number
  prizes: EventPrize[]
}

export interface EventPrize {
  id: number
  eventGameId: number
  prizeId: number
  rank: number
}

// export interface Event {
//   id: number
//   name: string
//   date: string
//   startTime: string
//   endTime: string
//   maxParticipants: number
//   assignedPonds: number[]
//   eventGames: EventGame[]
//   entryFee: number
//   bookingOpens: string
//   status: 'open' | 'upcoming' | 'closed' | 'active' | 'completed'
// }

// export interface CatchRecord {
//   id: string
//   eventId: number
//   userId: number
//   gameId: number
//   weight?: number
//   length?: number
//   timestamp: string
//   verified: boolean
//   photo?: string
// }

export interface LeaderboardEntry {
  userId: number
  gameId: number
  value: number
  rank: number
  timestamp: string
}

export interface EventLeaderboard {
  eventId: number
  gameId: number
  entries: LeaderboardEntry[]
  lastUpdated: string
}

export interface QRValidationResult {
  valid: boolean
  bookingId?: string
  error?: string
}

// export interface Notification {
//   id: number
//   userId: number
//   title: string
//   message: string
//   type: 'info' | 'success' | 'warning' | 'error'
//   read: boolean
//   createdAt: string
// }

// Notification interface
export interface Notification {
  id: number
  userId: number
  type: 'booking' | 'event' | 'maintenance' | 'system' | 'promotion'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
}

export interface Database {
  ponds: Pond[]
  events: Event[]
  timeSlots: TimeSlot[]
  users: any[] // Consider creating User interface
  bookings: BookingData[]
  checkIns: CheckInRecord[]
  notifications: Notification[]
  currentBooking: BookingData | null
  catches: CatchRecord[]
  games: Game[]
  prizes: Prize[]
  eventGames: EventGame[]
  eventPrizes: EventPrize[]
  // leaderboards: EventLeaderboard[]
  
}