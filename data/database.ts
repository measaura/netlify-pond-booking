// Database file - Contains all default data and acts as persistent storage
// This file simulates a real database with tables and data

import { 
  Database,
  BookingData, 
  Pond, 
  Event, 
  TimeSlot, 
  CheckInRecord, 
  CatchRecord,
  Notification,
  Game,
  Prize,
  EventGame,
  EventPrize,
  LeaderboardEntry,
  EventLeaderboard,
  QRValidationResult
} from '@/types'
import { User } from '@/lib/auth'



// // Game interface
// export interface Game {
//   id: number
//   name: string
//   type: 'heaviest' | 'nearest' | 'biggest' | 'other'
//   targetValue?: number
//   measurementUnit: 'kg' | 'cm' | 'other'
//   decimalPlaces?: number
//   description: string
//   isActive: boolean
//   createdAt: string
//   updatedAt: string
// }

// // Prize interface
// export interface Prize {
//   id: number
//   name: string
//   type: 'money' | 'item'
//   value: number
//   description: string
//   isActive: boolean
//   createdAt: string
//   updatedAt: string
// }

// // EventGame interface
// export interface EventGame {
//   id: number
//   eventId: number
//   gameId: number
//   prizes: EventPrize[]
// }

// // EventPrize interface
// export interface EventPrize {
//   id: number
//   eventGameId: number
//   prizeId: number
//   rank: number
// }

// Database structure
// export interface Database {
//   ponds: Pond[]
//   events: Event[]
//   timeSlots: TimeSlot[]
//   users: User[]
//   bookings: BookingData[]
//   checkIns: CheckInRecord[]
//   notifications: Notification[]
//   currentBooking: BookingData | null
//   catches: CatchRecord[]
//   games: Game[]
//   prizes: Prize[]
//   eventGames: EventGame[]
//   eventPrizes: EventPrize[]
// }

// Default Ponds Data
export const defaultPonds: Pond[] = [
  {
    id: 1,
    name: "Emerald Lake",
    image: "🌊",
    capacity: 20,
    price: 25,
    available: 20,
    bookingEnabled: true,
    shape: 'rectangle',
    seatingArrangement: [4, 6, 4, 6]
  },
  {
    id: 2,
    name: "Sunset Bay",
    image: "🌅",
    capacity: 15,
    price: 30,
    available: 15,
    bookingEnabled: true,
    shape: 'square',
    seatingArrangement: [4, 4, 4, 3]
  },
  {
    id: 3,
    name: "Silver Basin",
    image: "🏔️",
    capacity: 12,
    price: 20,
    available: 12,
    bookingEnabled: true,
    shape: 'rectangle',
    seatingArrangement: [3, 6, 3, 6]
  },
  {
    id: 4,
    name: "Crystal Pond",
    image: "💎",
    capacity: 18,
    price: 35,
    available: 18,
    bookingEnabled: true,
    shape: 'circle',
    seatingArrangement: [18]
  },
  {
    id: 5,
    name: "Whispering Waters",
    image: "🌿",
    capacity: 8,
    price: 40,
    available: 8,
    bookingEnabled: true,
    shape: 'rectangle',
    seatingArrangement: [2, 2, 2, 2]
  }
]

// Calculate current time for active event
const now = new Date()
const startTime = new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
const endTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
const startTimeStr = startTime.getHours().toString().padStart(2, '0') + ':' + startTime.getMinutes().toString().padStart(2, '0')
const endTimeStr = endTime.getHours().toString().padStart(2, '0') + ':' + endTime.getMinutes().toString().padStart(2, '0')

// Add default event games with prizes
export const defaultEventGames: EventGame[] = [
  {
    id: 1,
    eventId: 1,
    gameId: 1,
    prizes: [
      {
        id: 1,
        eventGameId: 1,
        prizeId: 1,
        rank: 1
      },
      {
        id: 2,
        eventGameId: 1,
        prizeId: 2,
        rank: 2
      }
    ]
  },
  {
    id: 2,
    eventId: 1,
    gameId: 2,
    prizes: [
      {
        id: 3,
        eventGameId: 2,
        prizeId: 1,
        rank: 1
      }
    ]
  }
]

// Update defaultEvents to reference the games and prizes
export const defaultEvents: Event[] = [
  {
    id: 1,
    name: "Live Fishing Championship",
    date: "2025-10-18",
    startTime: startTimeStr,
    endTime: endTimeStr,
    maxParticipants: 50,
    assignedPonds: [1],
    games: [
      {
        id: 1,
        name: "Heaviest Catch",
        type: "heaviest",
        measurementUnit: "kg",
        description: "Catch the heaviest fish to win!",
        prizes: [
          {
            id: 1,
            name: "Gold Trophy",
            type: "item",
            value: 1000,
            description: "Awarded for the heaviest catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "Cash Prize",
            type: "money",
            value: 500,
            description: "Cash prize for the heaviest catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      },
      {
        id: 2,
        name: "Nearest Weight",
        type: "nearest",
        targetValue: 5.20,
        measurementUnit: "kg",
        description: "Catch a fish closest to the target weight to win!",
        prizes: [
          {
            id: 3,
            name: "Silver Trophy",
            type: "item",
            value: 750,
            description: "Awarded for the nearest weight catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 4,
            name: "Cash Prize",
            type: "money",
            value: 300,
            description: "Cash prize for the nearest weight catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    entryFee: 75,
    bookingOpens: "2025-09-01T00:00:00Z",
    status: "completed"
  },
  {
    id: 3,
    name: "Sunrise Trout Challenge",
    date: "2025-09-22",
    startTime: "05:30",
    endTime: "11:00",
    maxParticipants: 30,
    assignedPonds: [3],
    games: [
      {
        id: 3,
        name: "Biggest Length",
        type: "biggest",
        measurementUnit: "cm",
        description: "Catch the longest fish to win!",
        prizes: [
          {
            id: 5,
            name: "Gold Trophy",
            type: "item",
            value: 1000,
            description: "Awarded for the biggest length catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 6,
            name: "Cash Prize",
            type: "money",
            value: 500,
            description: "Cash prize for the biggest length catch",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    entryFee: 50,
    bookingOpens: "2025-09-01T00:00:00Z",
    status: "open"
  }
]


// Default Time Slots Data
export const defaultTimeSlots: TimeSlot[] = [
  { id: 1, time: "6:00 AM - 12:00 PM", label: "Morning Session" },
  { id: 2, time: "12:00 PM - 6:00 PM", label: "Afternoon Session" },
  { id: 3, time: "6:00 PM - 10:00 PM", label: "Evening Session" },
  { id: 4, time: "6:00 AM - 2:00 PM", label: "Competition Session" },
  { id: 5, time: "5:30 AM - 11:00 AM", label: "Early Morning Session" },
  { id: 6, time: "7:00 PM - 11:00 PM", label: "Night Session" },
  { id: 7, time: "14:06 - 14:31", label: "Active Event Session" }
]

// Default Users Data (for testing)
export const defaultUsers: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "user1@fishing.com",
    password: "123456@$",
    role: "user",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  },
  {
    id: 2, 
    name: "Jane Smith",
    email: "user2@fishing.com",
    password: "123456@$",
    role: "user",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "user3@fishing.com",
    password: "123456@$",
    role: "user",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  },
  {
    id: 4,
    name: "Sarah Manager",
    email: "manager1@fishing.com",
    password: "123456@$",
    role: "manager",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  },
  {
    id: 5,
    name: "David Manager",
    email: "manager2@fishing.com",
    password: "123456@$",
    role: "manager",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  },
  {
    id: 6,
    name: "Admin Smith",
    email: "admin@fishing.com",
    password: "123456@$",
    role: "admin",
    isActive: true,
    createdAt: new Date('2025-09-01T00:00:00Z').toISOString()
  }
]

// Default Bookings Data
export const defaultBookings: BookingData[] = [
  // Event Bookings for Active Event (Live Fishing Championship)
  {
    bookingId: 'FG1726665960000', // Current timestamp for active event
    type: 'event',
    pond: {
      id: 1,
      name: "Emerald Lake",
      image: "🌊"
    },
    event: {
      id: 1,
      name: "Live Fishing Championship",
      prize: "$2,500"
    },
    seats: [
      { id: 1, row: 'A', number: 1 }
    ],
    timeSlot: {
      id: 7,
      time: `${startTimeStr} - ${endTimeStr}`, // Use dynamic timing
      label: 'Active Event Session'
    },
    date: '2025-09-18', // Today
    totalPrice: 75,
    createdAt: new Date('2025-09-18T14:00:00Z').toISOString(),
    userId: 1,
    userName: 'John Doe',
    userEmail: 'user1@fishing.com'
  },
  {
    bookingId: 'FG1726665970000',
    type: 'event',
    pond: {
      id: 1,
      name: "Emerald Lake",
      image: "🌊"
    },
    event: {
      id: 1,
      name: "Live Fishing Championship",
      prize: "$2,500"
    },
    seats: [
      { id: 2, row: 'A', number: 2 }
    ],
    timeSlot: {
      id: 7,
      time: `${startTimeStr} - ${endTimeStr}`, // Use dynamic timing
      label: 'Active Event Session'
    },
    date: '2025-09-18', // Today
    totalPrice: 75,
    createdAt: new Date('2025-09-18T14:00:00Z').toISOString(),
    userId: 2,
    userName: 'Jane Smith',
    userEmail: 'user2@fishing.com'
  },
  {
    bookingId: 'FG1726665980000',
    type: 'event',
    pond: {
      id: 1,
      name: "Emerald Lake",
      image: "🌊"
    },
    event: {
      id: 1,
      name: "Live Fishing Championship",
      prize: "$2,500"
    },
    seats: [
      { id: 3, row: 'A', number: 3 }
    ],
    timeSlot: {
      id: 7,
      time: `${startTimeStr} - ${endTimeStr}`, // Use dynamic timing
      label: 'Active Event Session'
    },
    date: '2025-09-18', // Today
    totalPrice: 75,
    createdAt: new Date('2025-09-18T14:00:00Z').toISOString(),
    userId: 3,
    userName: 'Mike Johnson',
    userEmail: 'user3@fishing.com'
  },
  // Original Bookings (for other events/ponds)
  {
    bookingId: 'FG1726243800000',
    type: 'pond',
    pond: {
      id: 1,
      name: "Emerald Lake",
      image: "🌊"
    },
    seats: [
      { id: 15, row: 'C', number: 15 },
      { id: 16, row: 'C', number: 16 }
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
      id: 2,
      name: "Bass Masters Cup",
      prize: "$2,500"
    },
    seats: [
      { id: 20, row: 'D', number: 20 }
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

// Default Check-ins Data
export const defaultCheckIns: CheckInRecord[] = [
  {
    id: 'checkin-001',
    bookingId: 'FG1726243800000',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    pond: {
      id: 1,
      name: 'Emerald Lake'
    },
    seats: [
      { id: 1, row: 'A', number: 1 },
      { id: 2, row: 'A', number: 2 }
    ],
    checkInTime: new Date('2025-09-13T08:30:00Z').toISOString(),
    checkOutTime: undefined,
    timeSlot: {
      id: 1,
      time: '6:00 AM - 12:00 PM',
      label: 'Morning Session'
    },
    date: '2025-09-15',
    status: 'checked-in',
    scannedBy: 'manager-1',
    type: 'pond',
    notes: 'First check-in of the day'
  },
  {
    id: 'checkin-002',
    bookingId: 'FG1725702900000',
    userId: 'user-1', 
    userName: 'John Doe',
    userEmail: 'john@example.com',
    pond: {
      id: 4,
      name: 'Crystal Pond'
    },
    seats: [
      { id: 5, row: 'A', number: 5 },
      { id: 6, row: 'A', number: 6 }
    ],
    checkInTime: new Date('2025-09-12T18:00:00Z').toISOString(),
    checkOutTime: new Date('2025-09-12T21:45:00Z').toISOString(),
    timeSlot: {
      id: 3,
      time: '6:00 PM - 10:00 PM',
      label: 'Evening Session'
    },
    date: '2025-09-12',
    status: 'checked-out',
    scannedBy: 'manager-1',
    type: 'pond',
    notes: 'Completed evening session'
  }
]

// Default Notifications Data
export const defaultNotifications: Notification[] = [
  // User 1 notifications (John Doe)
  {
    id: 1,
    userId: 1,
    type: 'booking',
    title: 'Booking Reminder',
    message: 'Your fishing session at Emerald Lake starts in 2 hours!\n\nBooking Details:\n• Pond: Emerald Lake\n• Session: 6:00 AM - 12:00 PM\n• Date: September 15, 2025\n• Seats: A1, A2\n\nPlease arrive 15 minutes early for check-in.',
    isRead: false,
    createdAt: new Date('2025-09-13T04:00:00Z').toISOString(),
    priority: 'high',
    actionUrl: '/ticket?bookingId=FG1726243800000&source=notifications'
  },
  {
    id: 2,
    userId: 1,
    type: 'event',
    title: 'Tournament Registration Open',
    message: 'Bass Masters Championship registration is now open!\n\n🏆 Event Details:\n• Date: September 15, 2025\n• Location: Emerald Lake\n• Entry Fee: $75\n• Prize Pool: $2,500\n• Max Participants: 50\n\nEarly bird discount available until September 10th!',
    isRead: false,
    createdAt: new Date('2025-09-12T14:30:00Z').toISOString(),
    priority: 'medium',
    actionUrl: '/event-booking/1'
  },
  {
    id: 3,
    userId: 1,
    type: 'system',
    title: 'Achievement Unlocked',
    message: 'Congratulations! You\'ve earned the "Early Bird" achievement for booking 5 morning sessions.\n\n🏅 Achievement Reward:\n• Badge: Early Bird\n• Points: +100\n• Bonus: 10% discount on next booking',
    isRead: true,
    createdAt: new Date('2025-09-11T10:30:00Z').toISOString(),
    priority: 'medium'
  },

  // User 2 notifications (Jane Smith)
  {
    id: 4,
    userId: 2,
    type: 'event',
    title: 'Competition Starting Soon',
    message: 'Bass Masters Cup begins tomorrow at 6:00 AM. Good luck!\n\n📋 Final Reminders:\n• Check-in starts at 5:30 AM\n• Bring your fishing license\n• Equipment inspection at 5:45 AM\n• Tournament starts promptly at 6:00 AM\n\nWeather forecast: Sunny, 72°F',
    isRead: false,
    createdAt: new Date('2025-09-14T18:00:00Z').toISOString(),
    priority: 'high',
    actionUrl: '/event-booking/1'
  },
  {
    id: 5,
    userId: 2,
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your booking for Crystal Pond has been confirmed!\n\n📋 Booking Details:\n• Pond: Crystal Pond\n• Date: September 15, 2025\n• Session: 2:00 PM - 6:00 PM\n• Booking ID: FG1726157400000\n• Total Cost: $60\n\nYour confirmation receipt has been sent to your email.',
    isRead: true,
    createdAt: new Date('2025-09-12T16:20:00Z').toISOString(),
    priority: 'medium',
    actionUrl: '/ticket?bookingId=FG1726157400000&source=notifications'
  },

  // User 3 notifications (Mike Johnson)  
  {
    id: 6,
    userId: 3,
    type: 'promotion',
    title: 'Special Weekend Rates',
    message: '🎣 Weekend Special Offer!\n\n20% off all weekend bookings! Use promo code WEEKEND20.\n\n✨ Offer Details:\n• Valid until September 30th, 2025\n• Applies to Saturday & Sunday sessions\n• Cannot be combined with other offers\n• Maximum discount: $50\n\nBook now to secure your spot!',
    isRead: false,
    createdAt: new Date('2025-09-13T07:00:00Z').toISOString(),
    priority: 'low',
    actionUrl: '/book'
  },
  {
    id: 7,
    userId: 3,
    type: 'booking',
    title: 'Upcoming Session Today',
    message: 'Don\'t forget about your fishing session today!\n\n📍 Session Details:\n• Pond: Sunset Bay\n• Time: 2:00 PM - 6:00 PM\n• Seats: B3, B4\n• Check-in: 1:45 PM\n\nWeather looks perfect for fishing! 🌤️',
    isRead: false,
    createdAt: new Date('2025-09-13T09:00:00Z').toISOString(),
    priority: 'high',
    actionUrl: '/ticket?bookingId=FG1726186200000&source=notifications'
  },

  // Manager 1 notifications (Sarah Manager)
  {
    id: 8,
    userId: 4,
    type: 'maintenance',
    title: 'Pond Maintenance Scheduled',
    message: 'Crystal Pond will be closed for cleaning on Sept 20th from 2:00 AM - 5:00 AM.',
    isRead: false,
    createdAt: new Date('2025-09-13T09:15:00Z').toISOString(),
    priority: 'medium',
    actionUrl: '/manager/dashboard'
  },
  {
    id: 9,
    userId: 4,
    type: 'system',
    title: 'Daily Report Available',
    message: 'Your daily operations report for Sept 12th is ready for review.',
    isRead: true,
    createdAt: new Date('2025-09-13T01:00:00Z').toISOString(),
    priority: 'low',
    actionUrl: '/manager/reports'
  },
  {
    id: 10,
    userId: 4,
    type: 'system',
    title: 'Staff Schedule Updated',
    message: 'Weekend staff schedule has been updated. Please review assignments.',
    isRead: false,
    createdAt: new Date('2025-09-13T11:45:00Z').toISOString(),
    priority: 'medium',
    actionUrl: '/manager/staff'
  },

  // Manager 2 notifications (David Manager)
  {
    id: 11,
    userId: 5,
    type: 'maintenance',
    title: 'Equipment Maintenance Due',
    message: 'Emerald Lake fishing equipment inspection is due next week.',
    isRead: false,
    createdAt: new Date('2025-09-13T13:30:00Z').toISOString(),
    priority: 'high',
    actionUrl: '/manager/equipment'
  },
  {
    id: 12,
    userId: 5,
    type: 'system',
    title: 'Monthly Revenue Report',
    message: 'August revenue report shows 15% increase. Full details available.',
    isRead: true,
    createdAt: new Date('2025-09-01T08:00:00Z').toISOString(),
    priority: 'low',
    actionUrl: '/manager/reports'
  },

  // Admin notifications (Admin Smith)
  {
    id: 13,
    userId: 6,
    type: 'system',
    title: 'New User Registration',
    message: 'A new user "Alex Brown" has registered and is awaiting approval.',
    isRead: false,
    createdAt: new Date('2025-09-13T11:22:00Z').toISOString(),
    priority: 'medium',
    actionUrl: '/admin/users'
  },
  {
    id: 14,
    userId: 6,
    type: 'system',
    title: 'System Backup Completed',
    message: 'Weekly system backup completed successfully. All data secure.',
    isRead: true,
    createdAt: new Date('2025-09-13T02:00:00Z').toISOString(),
    priority: 'low',
    actionUrl: '/admin/system'
  },
  {
    id: 15,
    userId: 6,
    type: 'system',
    title: 'Manager Permission Request',
    message: 'Sarah Manager requested elevated permissions for pond management.',
    isRead: false,
    createdAt: new Date('2025-09-13T14:10:00Z').toISOString(),
    priority: 'high',
    actionUrl: '/admin/permissions'
  }
]

// Default Catch Records
export const defaultCatchRecords: CatchRecord[] = [
  {
    id: 1700000001,
    userId: 2,
    userName: 'Mike Johnson',
    userEmail: 'mike@example.com',
    bookingId: 'booking_1700000001',
    eventId: 1,
    eventName: 'Weekend Tournament',
    gameId: 1,
    pondId: 1,
    pondName: 'Emerald Lake',
    fishWeight: 2.5,
    fishLength: 45,
    fishSpecies: 'Bass',
    catchTime: '2025-01-20T10:30:00Z',
    recordedBy: 'manager@example.com',
    recordedAt: '2025-01-20T10:32:00Z',
    isVerified: true,
    verified: true,
    timestamp: '2025-01-20T10:30:00Z',
    photo: 'https://example.com/catches/1.jpg',
    notes: 'Beautiful bass caught on morning session'
  },
  {
    id: 1700000002,
    userId: 3,
    userName: 'Sarah Davis',
    userEmail: 'sarah@example.com',
    bookingId: 'booking_1700000002',
    eventId: 1,
    eventName: 'Weekend Tournament',
    gameId: 1,
    pondId: 1,
    pondName: 'Emerald Lake',
    fishWeight: 3.2,
    fishLength: 52,
    fishSpecies: 'Bass',
    catchTime: '2025-01-20T11:15:00Z',
    recordedBy: 'manager@example.com',
    recordedAt: '2025-01-20T11:17:00Z',
    isVerified: true,
    timestamp: '2025-01-20T11:15:00Z',
    verified: true,
    photo: 'https://example.com/catches/2.jpg',
    notes: 'Tournament leader so far!'
  },
  {
    id: 1700000003,
    userId: 2,
    userName: 'Mike Johnson',
    userEmail: 'mike@example.com',
    bookingId: 'booking_1700000003',
    eventId: 1,
    eventName: 'Weekend Tournament',
    gameId: 2,
    pondId: 2,
    pondName: 'Sunset Bay',
    fishWeight: 1.8,
    fishLength: 38,
    fishSpecies: 'Trout',
    catchTime: '2025-01-20T14:20:00Z',
    recordedBy: 'manager@example.com',
    recordedAt: '2025-01-20T14:22:00Z',
    isVerified: true,
    timestamp: '2025-01-20T14:20:00Z',
    verified: true,
    photo: 'https://example.com/catches/3.jpg',
    notes: 'Second catch of the day'
  },
  {
    id: 1700000004,
    userId: 5,
    userName: 'Tom Wilson',
    userEmail: 'tom@example.com',
    bookingId: 'booking_1700000004',
    eventId: 2,
    eventName: 'Morning Competition',
    gameId: 1,
    pondId: 2,
    pondName: 'Golden Creek',
    fishWeight: 4.1,
    fishLength: 61,
    fishSpecies: 'Pike',
    catchTime: '2025-01-21T08:45:00Z',
    recordedBy: 'manager@example.com',
    recordedAt: '2025-01-21T08:47:00Z',
    isVerified: true,
    timestamp: '2025-01-21T08:45:00Z',
    verified: true,
    photo: 'https://example.com/catches/4.jpg',
    notes: 'Impressive pike! New pond record'
  },
  {
    id: 1700000005,
    userId: 3,
    userName: 'Sarah Davis',
    userEmail: 'sarah@example.com',
    bookingId: 'booking_1700000005',
    eventId: 3,
    eventName: 'Evening Challenge',
    gameId: 2,
    pondId: 3,
    pondName: 'Silver Basin',
    fishWeight: 2.8,
    fishLength: 47,
    fishSpecies: 'Bass',
    catchTime: '2025-01-19T16:10:00Z',
    recordedBy: 'manager@example.com',
    recordedAt: '2025-01-19T16:12:00Z',
    isVerified: true,
    timestamp: '2025-01-19T16:10:00Z',
    verified: true,
    photo: 'https://example.com/catches/5.jpg',
    notes: 'Regular pond fishing session'
  }
]

// Update the Database interface to include the new collections
// export interface Database {
//   ponds: Pond[]
//   events: Event[]
//   timeSlots: TimeSlot[]
//   users: User[]
//   bookings: BookingData[]
//   checkIns: CheckInRecord[]
//   notifications: Notification[]
//   currentBooking: BookingData | null
//   catches: CatchRecord[]
//   games: Game[]
//   prizes: Prize[]
//   eventGames: EventGame[]
//   eventPrizes: EventPrize[]
// }

// Update createInitialDatabase
export const createInitialDatabase = (): Database => {
  const eventPrizes = defaultEventGames.flatMap(eg => eg.prizes)
  
  return {
    ponds: [...defaultPonds],
    events: [...defaultEvents],
    timeSlots: [...defaultTimeSlots],
    users: [...defaultUsers],
    bookings: [...defaultBookings],
    checkIns: [...defaultCheckIns],
    notifications: [...defaultNotifications],
    currentBooking: null,
    catches: [...defaultCatchRecords],
    games: [...defaultGames],
    prizes: [...defaultPrizes],
    eventGames: [...defaultEventGames],
    eventPrizes: eventPrizes
  }
}

// Add default games data
export const defaultGames: Game[] = [
  {
    id: 1,
    name: "Heaviest Bass",
    type: "heaviest",
    measurementUnit: "kg",
    description: "Catch the heaviest bass fish",
    prizes: [
      {
        id: 1,
        name: "Grand Prize",
        type: "money",
        value: 2500,
        description: "First place cash prize",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Target Weight Challenge",
    type: "nearest",
    targetValue: 2.5,
    measurementUnit: "kg",
    decimalPlaces: 2,
    description: "Catch fish nearest to target weight",
    prizes: [
      {
        id: 2,
        name: "Runner Up",
        type: "money",
        value: 1000,
        description: "Second place cash prize",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Longest Fish",
    type: "biggest",
    measurementUnit: "cm",
    description: "Catch the longest fish",
    prizes: [
      {
        id: 3,
        name: "Premium Rod",
        type: "item",
        value: 500,
        description: "High-end fishing rod",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Add default prizes data
export const defaultPrizes: Prize[] = [
  {
    id: 1,
    name: "Grand Prize",
    type: "money",
    value: 2500,
    description: "First place cash prize",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Runner Up",
    type: "money",
    value: 1000,
    description: "Second place cash prize",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Premium Rod",
    type: "item",
    value: 500,
    description: "High-end fishing rod",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Export everything for easy access
export default {
  createInitialDatabase,
  defaultPonds,
  defaultEvents,
  defaultTimeSlots, 
  defaultUsers,
  defaultBookings,
  defaultCheckIns,
  defaultNotifications,
  defaultCatchRecords,
  defaultGames,
  defaultPrizes,
  defaultEventGames
}
