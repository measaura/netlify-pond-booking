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

  // 4. Seed events
  console.log('Seeding events...')
  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Weekend Fishing Championship',
      description: 'A competitive fishing event with multiple games',
      date: new Date('2024-12-15'),
      startTime: '08:00',
      endTime: '17:00',
      maxParticipants: 50,
      maxSeatsPerBooking: 5,
      entryFee: 100.0,
      bookingOpens: new Date('2024-12-01'),
      status: 'upcoming',
    },
  })

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'New Year Fishing Festival',
      description: 'Start the year with a great fishing competition',
      date: new Date('2025-01-01'),
      startTime: '06:00',
      endTime: '18:00',
      maxParticipants: 80,
      maxSeatsPerBooking: 3,
      entryFee: 150.0,
      bookingOpens: new Date('2024-12-15'),
      status: 'upcoming',
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

  // 8. Create some sample bookings
  console.log('Seeding sample bookings...')
  const users = await prisma.user.findMany({ where: { role: UserRole.USER } })
  
  // Pond bookings
  if (users.length > 0) {
    const pondBooking = await prisma.booking.create({
      data: {
        bookingId: 'POND_001',
        type: BookingType.POND,
        bookedByUserId: users[0].id, // Group leader who made the booking
        pondId: 1,
        date: new Date('2024-12-10'),
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
        date: new Date('2024-12-15'),
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

  console.log('Database seed completed successfully!')
  console.log('Created:')
  console.log('- 4+ ponds with proper capacity and shape settings')
  console.log('- 1 admin, 1 manager, 5 regular users')
  console.log('- 2 events with multiple games and rank-based prizes')
  console.log('- Sample bookings for both pond and event types')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
