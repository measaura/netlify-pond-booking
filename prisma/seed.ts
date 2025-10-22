import { PrismaClient, UserRole, BookingType, GameType, PondShape, PrizeType } from '@prisma/client'
import { createInitialDatabase } from '../data/database'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')
  
  // Get all sample data
  const sampleData: any = createInitialDatabase()
  
  // 1. Seed time slots first
  console.log('Seeding time slots...')
  for (const timeSlot of sampleData.timeSlots) {
    await prisma.timeSlot.upsert({
      where: { id: timeSlot.id },
      update: {},
      create: {
        id: timeSlot.id,
        time: timeSlot.time,
        label: timeSlot.label,
      },
    })
  }

  // 2. Seed ponds with new structure
  console.log('Seeding ponds...')
  for (const pond of sampleData.ponds) {
    // Convert string shape to enum
  let pondShape: PondShape = PondShape.RECTANGLE
  const shapeStr = (pond.shape || '').toString().toLowerCase()
  if (shapeStr === 'circle') pondShape = ('CIRCLE' as unknown) as PondShape
  else if (shapeStr === 'square') pondShape = ('SQUARE' as unknown) as PondShape
    
    await prisma.pond.upsert({
      where: { id: pond.id },
      update: {},
      create: {
        id: pond.id,
        name: pond.name,
        image: pond.image,
        maxCapacity: pond.capacity, // Renamed from capacity
        price: pond.price,
        bookingEnabled: pond.bookingEnabled,
        // Cast to any to avoid TS enum mismatch between generated types and runtime values
        shape: pondShape as any,
        seatingArrangement: pond.seatingArrangement,
      },
    })
  }

  // 3. Seed users with proper roles
  console.log('Seeding users...')
  // Create default admin user
  await prisma.user.upsert({
    where: { email: 'admin@fishingpond.com' },
    update: {},
    create: {
      email: 'admin@fishingpond.com',
      name: 'System Admin',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
  })

  // Create default manager user
  await prisma.user.upsert({
    where: { email: 'manager@fishingpond.com' },
    update: {},
    create: {
      email: 'manager@fishingpond.com',
      name: 'Pond Manager',
      password: 'manager123',
      role: UserRole.MANAGER,
    },
  })

  // Create some regular users
  const regularUsers = [
    { email: 'john@example.com', name: 'John Smith' },
    { email: 'jane@example.com', name: 'Jane Doe' },
    { email: 'mike@example.com', name: 'Mike Johnson' },
    { email: 'sarah@example.com', name: 'Sarah Wilson' },
    { email: 'tom@example.com', name: 'Tom Brown' },
  ]

  for (const userData of regularUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: 'user123',
        role: UserRole.USER,
      },
    })
  }

  // 4. Seed events with dynamic dates
  console.log('Seeding events...')
  const now = new Date()
  const nextWeekend = new Date(now)
  nextWeekend.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7) + 7) // Next Saturday
  const nextMonth = new Date(now)
  nextMonth.setMonth(now.getMonth() + 1)
  nextMonth.setDate(1) // First day of next month
  
  // Clear existing events, games, prizes to allow fresh data
  await prisma.prize.deleteMany({})
  await prisma.game.deleteMany({})
  await prisma.eventPond.deleteMany({})
  await prisma.event.deleteMany({})
  
  const event1 = await prisma.event.create({
    data: {
      id: 1,
      name: 'Weekend Fishing Championship',
      description: 'A competitive fishing event with multiple games',
      date: nextWeekend,
      startTime: '08:00',
      endTime: '17:00',
      maxParticipants: 50,
      maxSeatsPerBooking: 5,
      entryFee: 100.0,
      bookingOpens: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Opened 1 week ago
      status: 'open', // Changed to 'open' so users can book
    },
  })

  const event2 = await prisma.event.create({
    data: {
      id: 2,
      name: 'New Year Fishing Festival',
      description: 'Start the year with a great fishing competition',
      date: nextMonth,
      startTime: '06:00',
      endTime: '18:00',
      maxParticipants: 80,
      maxSeatsPerBooking: 3,
      entryFee: 150.0,
      bookingOpens: now, // Opens today
      status: 'open', // Changed to 'open' so users can book
    },
  })

  // 5. Link events to ponds
  console.log('Linking events to ponds...')
  // Event 1 uses ponds 1, 2, 3
  for (const pondId of [1, 2, 3]) {
    await prisma.eventPond.upsert({
      where: { eventId_pondId: { eventId: 1, pondId } },
      update: {},
      create: { eventId: 1, pondId },
    })
  }

  // Event 2 uses ponds 2, 3, 4
  for (const pondId of [2, 3, 4]) {
    await prisma.eventPond.upsert({
      where: { eventId_pondId: { eventId: 2, pondId } },
      update: {},
      create: { eventId: 2, pondId },
    })
  }

  // 6. Seed games linked to events
  console.log('Seeding games...')
  const game1 = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Heaviest Fish',
      type: GameType.HEAVIEST_WEIGHT,
      measurementUnit: 'kg',
      decimalPlaces: 2,
      description: 'Catch the heaviest fish to win',
      eventId: 1,
    },
  })

  const game2 = await prisma.game.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Target Weight Challenge',
      type: GameType.TARGET_WEIGHT,
      targetWeight: 2.5,
      measurementUnit: 'kg',
      decimalPlaces: 2,
      description: 'Get as close as possible to 2.5kg',
      eventId: 1,
    },
  })

  const game3 = await prisma.game.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'New Year Biggest Catch',
      type: GameType.HEAVIEST_WEIGHT,
      measurementUnit: 'kg',
      decimalPlaces: 2,
      description: 'Start the year with the biggest catch',
      eventId: 2,
    },
  })

  // 7. Seed prizes for games
  console.log('Seeding prizes...')
  // Prizes for Game 1 (Heaviest Fish)
  const game1Prizes = [
    { rank: [1, 1], value: 5000, name: '1st Place - Heaviest Fish' },
    { rank: [2, 2], value: 3000, name: '2nd Place - Heaviest Fish' },
    { rank: [3, 3], value: 1500, name: '3rd Place - Heaviest Fish' },
    { rank: [4, 10], value: 500, name: '4th-10th Place - Heaviest Fish' },
  ]

  for (const prizeData of game1Prizes) {
    await prisma.prize.create({
      data: {
        name: prizeData.name,
        type: PrizeType.MONEY,
        value: prizeData.value,
        rankStart: prizeData.rank[0],
        rankEnd: prizeData.rank[1],
        description: `Prize for ranks ${prizeData.rank[0]} to ${prizeData.rank[1]}`,
        gameId: 1,
      },
    })
  }

  // Prizes for Game 2 (Target Weight)
  const game2Prizes = [
    { rank: [1, 1], value: 2000, name: '1st Place - Target Weight' },
    { rank: [2, 2], value: 1000, name: '2nd Place - Target Weight' },
    { rank: [3, 5], value: 500, name: '3rd-5th Place - Target Weight' },
  ]

  for (const prizeData of game2Prizes) {
    await prisma.prize.create({
      data: {
        name: prizeData.name,
        type: PrizeType.MONEY,
        value: prizeData.value,
        rankStart: prizeData.rank[0],
        rankEnd: prizeData.rank[1],
        description: `Prize for ranks ${prizeData.rank[0]} to ${prizeData.rank[1]}`,
        gameId: 2,
      },
    })
  }

  // Prizes for Game 3 (New Year)
  const game3Prizes = [
    { rank: [1, 1], value: 10000, name: 'New Year Grand Prize' },
    { rank: [2, 2], value: 5000, name: 'New Year 2nd Prize' },
    { rank: [3, 3], value: 2500, name: 'New Year 3rd Prize' },
    { rank: [4, 20], value: 1000, name: 'New Year Participation Prize' },
  ]

  for (const prizeData of game3Prizes) {
    await prisma.prize.create({
      data: {
        name: prizeData.name,
        type: PrizeType.MONEY,
        value: prizeData.value,
        rankStart: prizeData.rank[0],
        rankEnd: prizeData.rank[1],
        description: `Prize for ranks ${prizeData.rank[0]} to ${prizeData.rank[1]}`,
        gameId: 3,
      },
    })
  }

  // 8. Create some sample bookings with dynamic dates
  console.log('Seeding sample bookings...')
  const users = await prisma.user.findMany({ where: { role: UserRole.USER } })
  
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(now.getDate() + 7)
  
  // Clear existing data in correct order (foreign key constraints)
  await prisma.catchRecord.deleteMany({})
  await prisma.bookingSeat.deleteMany({})
  await prisma.booking.deleteMany({})
  
  // Pond bookings for tomorrow (so ponds aren't fully booked today!)
  if (users.length > 0) {
    const pondBooking = await prisma.booking.create({
      data: {
        bookingId: 'POND_001',
        type: BookingType.POND,
        bookedByUserId: users[0].id, // Group leader who made the booking
        pondId: 1,
        date: tomorrow, // Changed to tomorrow instead of past date
        timeSlotId: 1,
        seatsBooked: 2,
        totalPrice: 60.0,
      },
    })

    // Create individual seat assignments for the pond booking
    await prisma.bookingSeat.createMany({
      data: [
        {
          bookingId: pondBooking.id,
          assignedUserId: users[0].id,
          seatNumber: 1,
          qrCode: `POND_001_SEAT_1_${Date.now()}`,
        },
        {
          bookingId: pondBooking.id,
          assignedUserId: users[1]?.id || users[0].id,
          seatNumber: 2,
          qrCode: `POND_001_SEAT_2_${Date.now()}`,
        }
      ]
    })

    const eventBooking = await prisma.booking.create({
      data: {
        bookingId: 'EVENT_001',
        type: BookingType.EVENT,
        bookedByUserId: users[1]?.id || users[0].id, // Group leader
        eventId: 1,
        pondId: 1,
        date: nextWeekend, // Use the event date
        seatsBooked: 3,
        totalPrice: 100.0,
      },
    })

    // Create individual seat assignments for the event booking
    await prisma.bookingSeat.createMany({
      data: [
        {
          bookingId: eventBooking.id,
          assignedUserId: users[1]?.id || users[0].id,
          seatNumber: 1,
          qrCode: `EVENT_001_SEAT_1_${Date.now()}`,
        },
        {
          bookingId: eventBooking.id,
          assignedUserId: users[0].id,
          seatNumber: 2,
          qrCode: `EVENT_001_SEAT_2_${Date.now()}`,
        },
        {
          bookingId: eventBooking.id,
          assignedUserId: users[2]?.id || users[0].id,
          seatNumber: 3,
          qrCode: `EVENT_001_SEAT_3_${Date.now()}`,
        }
      ]
    })
  }

  // 9. Add sample catch records for leaderboard testing
  console.log('Seeding sample catch records...')
  if (users.length > 0) {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    
    // First, get the pond booking we created
    const sampleBooking = await prisma.booking.findFirst({
      where: { type: BookingType.POND }
    })
    
    if (sampleBooking) {
      // Sample catches from various users
      const sampleCatches = [
        { userId: users[0].id, weight: 3.5, species: 'Bass' },
        { userId: users[1]?.id || users[0].id, weight: 2.8, species: 'Trout' },
        { userId: users[0].id, weight: 4.2, species: 'Catfish' },
        { userId: users[2]?.id || users[0].id, weight: 1.9, species: 'Perch' },
        { userId: users[1]?.id || users[0].id, weight: 5.1, species: 'Bass' },
        { userId: users[3]?.id || users[0].id, weight: 2.3, species: 'Trout' },
        { userId: users[0].id, weight: 3.9, species: 'Bass' },
      ]

      for (const catchData of sampleCatches) {
        await prisma.catchRecord.create({
          data: {
            userId: catchData.userId,
            bookingId: sampleBooking.id, // Link to booking instead of pond
            species: catchData.species,
            weight: catchData.weight,
            isVerified: true,
            recordedBy: 'System',
            createdAt: yesterday,
          },
        })
      }
    }
  }

  console.log('Database seed completed successfully!')
  console.log('Created:')
  console.log('- 4+ ponds with proper capacity and shape settings')
  console.log('- 1 admin, 1 manager, 5 regular users')
  console.log('- 2 open events (bookable) with multiple games and rank-based prizes')
  console.log('- Sample bookings for tomorrow (ponds available today!)')
  console.log('- 7 sample catch records for leaderboard testing')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
