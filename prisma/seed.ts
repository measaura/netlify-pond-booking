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
  await prisma.leaderboardEntry.deleteMany({})
  await prisma.eventLeaderboard.deleteMany({})
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

  // 6. Seed game templates (no eventId - they're reusable now)
  console.log('Seeding game templates...')
  await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Heaviest Fish',
      type: GameType.HEAVIEST_WEIGHT,
      measurementUnit: 'kg',
      decimalPlaces: 3,
      description: 'Catch the heaviest fish to win',
      isActive: true,
    },
  })

  await prisma.game.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Target Weight Challenge',
      type: GameType.TARGET_WEIGHT,
      targetWeight: 2.5,
      targetDirection: 'uptrend',
      measurementUnit: 'kg',
      decimalPlaces: 3,
      description: 'Get as close as possible to 2.5kg (closest wins)',
      isActive: true,
    },
  })

  await prisma.game.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Exact Weight',
      type: GameType.EXACT_WEIGHT,
      targetWeight: 1.5,
      measurementUnit: 'kg',
      decimalPlaces: 3,
      description: 'Hit exactly 1.5kg',
      isActive: true,
    },
  })

  // 7. Create prize sets
  console.log('Creating prize sets...')
  const prizeSet1 = await prisma.prizeSet.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Standard Podium',
      description: 'Top 3 winners with prize pool',
      isActive: true,
    },
  })

  const prizeSet2 = await prisma.prizeSet.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Big Pool',
      description: 'Large event with top 10 prizes',
      isActive: true,
    },
  })

  // 8. Seed prizes for prize sets
  console.log('Seeding prizes...')
  
  // Prizes for PrizeSet 1 (Standard Podium)
  const prizeSet1Prizes = [
    { rank: [1, 1], value: 5000, name: '1st Place' },
    { rank: [2, 2], value: 3000, name: '2nd Place' },
    { rank: [3, 3], value: 1500, name: '3rd Place' },
  ]

  for (const prizeData of prizeSet1Prizes) {
    await prisma.prize.create({
      data: {
        name: prizeData.name,
        type: PrizeType.MONEY,
        value: prizeData.value,
        rankStart: prizeData.rank[0],
        rankEnd: prizeData.rank[1],
        description: `Prize for rank ${prizeData.rank[0]}`,
        prizeSetId: 1,
      },
    })
  }

  // Prizes for PrizeSet 2 (Big Pool)
  const prizeSet2Prizes = [
    { rank: [1, 1], value: 10000, name: 'Grand Prize' },
    { rank: [2, 2], value: 5000, name: '2nd Prize' },
    { rank: [3, 3], value: 2500, name: '3rd Prize' },
    { rank: [4, 10], value: 1000, name: '4th-10th Place' },
  ]

  for (const prizeData of prizeSet2Prizes) {
    await prisma.prize.create({
      data: {
        name: prizeData.name,
        type: PrizeType.MONEY,
        value: prizeData.value,
        rankStart: prizeData.rank[0],
        rankEnd: prizeData.rank[1],
        description: `Prize for ranks ${prizeData.rank[0]} to ${prizeData.rank[1]}`,
        prizeSetId: 2,
      },
    })
  }

  // 9. Link games to events via EventGame junction table
  console.log('Linking games to events...')
  
  // Event 1 - Weekend Championship uses Game 1 (Heaviest) with PrizeSet 1
  await prisma.eventGame.create({
    data: {
      eventId: 1,
      gameId: 1,
      prizeSetId: 1,
      displayOrder: 1,
      isActive: true,
    },
  })

  // Event 1 - Weekend Championship also uses Game 2 (Target Weight) with PrizeSet 1
  await prisma.eventGame.create({
    data: {
      eventId: 1,
      gameId: 2,
      prizeSetId: 1,
      customGameName: 'Weekend Target Challenge', // Custom name for this event
      displayOrder: 2,
      isActive: true,
    },
  })

  // Event 2 - New Year Festival uses Game 1 (Heaviest) with PrizeSet 2 (bigger prizes)
  await prisma.eventGame.create({
    data: {
      eventId: 2,
      gameId: 1,
      prizeSetId: 2,
      customGameName: 'New Year Grand Tournament',
      displayOrder: 1,
      isActive: true,
    },
  })

  // 8. Seed achievements
  console.log('Seeding achievements...')
  
  const achievements = [
    // Milestone achievements
    { name: 'First Catch', description: 'Caught your first fish', icon: '🎣', category: 'MILESTONE', criteriaType: 'TOTAL_CATCHES', criteriaValue: 1, order: 1 },
    { name: 'First Booking', description: 'Made your first booking', icon: '📅', category: 'MILESTONE', criteriaType: 'TOTAL_BOOKINGS', criteriaValue: 1, order: 2 },
    { name: 'First Event', description: 'Joined your first event', icon: '🎪', category: 'MILESTONE', criteriaType: 'EVENTS_JOINED', criteriaValue: 1, order: 3 },
    
    // Skill achievements
    { name: 'Big Catch', description: 'Caught a fish over 3kg', icon: '🐟', category: 'SKILL', criteriaType: 'BIGGEST_CATCH', criteriaValue: 3, order: 4 },
    { name: 'Giant Catch', description: 'Caught a fish over 5kg', icon: '🐋', category: 'SKILL', criteriaType: 'BIGGEST_CATCH', criteriaValue: 5, order: 5 },
    { name: 'Master Angler', description: 'Caught fish in all ponds', icon: '👑', category: 'SKILL', criteriaType: 'POND_DIVERSITY', criteriaValue: 4, order: 6 },
    { name: 'Perfect Session', description: 'Complete a session with 5+ catches', icon: '✨', category: 'SKILL', criteriaType: 'SESSION_CATCHES', criteriaValue: 5, order: 7 },
    
    // Loyalty achievements
    { name: 'Regular Visitor', description: 'Made 10 bookings', icon: '⭐', category: 'LOYALTY', criteriaType: 'TOTAL_BOOKINGS', criteriaValue: 10, order: 8 },
    { name: 'Loyal Member', description: 'Made 25 bookings', icon: '💎', category: 'LOYALTY', criteriaType: 'TOTAL_BOOKINGS', criteriaValue: 25, order: 9 },
    { name: 'Legend', description: 'Made 50 bookings', icon: '🏅', category: 'LOYALTY', criteriaType: 'TOTAL_BOOKINGS', criteriaValue: 50, order: 10 },
    
    // Competitive achievements
    { name: 'Competition Winner', description: 'Won a fishing competition', icon: '🏆', category: 'COMPETITIVE', criteriaType: 'COMPETITIONS_WON', criteriaValue: 1, order: 11 },
    { name: 'Champion', description: 'Won 3 competitions', icon: '👑', category: 'COMPETITIVE', criteriaType: 'COMPETITIONS_WON', criteriaValue: 3, order: 12 },
    { name: 'Prize Winner', description: 'Won RM1000 in prizes', icon: '💰', category: 'COMPETITIVE', criteriaType: 'TOTAL_PRIZE_MONEY', criteriaValue: 1000, order: 13 },
    
    // Dedication achievements
    { name: 'Early Bird', description: 'Booked 5 morning slots', icon: '🌅', category: 'DEDICATION', criteriaType: 'MORNING_SLOTS', criteriaValue: 5, order: 14 },
    { name: 'Night Fisher', description: 'Complete 3 evening sessions', icon: '🌙', category: 'DEDICATION', criteriaType: 'EVENING_SLOTS', criteriaValue: 3, order: 15 },
    { name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', category: 'DEDICATION', criteriaType: 'CURRENT_STREAK', criteriaValue: 7, order: 16 },
    { name: 'Seasonal Master', description: 'Fish in all four seasons', icon: '🍂', category: 'DEDICATION', criteriaType: 'SEASONS_FISHED', criteriaValue: 4, order: 17 },
    
    // Social achievements
    { name: 'Social Angler', description: 'Book 5 group sessions', icon: '👥', category: 'SOCIAL', criteriaType: 'GROUP_SESSIONS', criteriaValue: 5, order: 18 },
    { name: 'Party Leader', description: 'Book 10 group sessions', icon: '🎉', category: 'SOCIAL', criteriaType: 'GROUP_SESSIONS', criteriaValue: 10, order: 19 },
    { name: 'Community Builder', description: 'Book 20 group sessions', icon: '🤝', category: 'SOCIAL', criteriaType: 'GROUP_SESSIONS', criteriaValue: 20, order: 20 },
  ]

  for (let i = 0; i < achievements.length; i++) {
    const ach = achievements[i]
    await prisma.achievement.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        id: i + 1,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category as any,
        criteriaType: ach.criteriaType,
        criteriaValue: ach.criteriaValue,
        displayOrder: ach.order,
        isActive: true,
      },
    })
  }

  // 9. Initialize user stats for existing users
  console.log('Initializing user stats...')
  const allUsers = await prisma.user.findMany()
  for (const user of allUsers) {
    await prisma.userStats.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        totalSessions: 0,
        totalBookings: 0,
        totalCatches: 0,
        eventsJoined: 0,
        competitionsWon: 0,
        totalPrizeMoney: 0,
        currentStreak: 0,
        longestStreak: 0,
        morningSlots: 0,
        eveningSlots: 0,
        groupSessions: 0,
      },
    })
  }

  // 10. Create some sample bookings with dynamic dates
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
  console.log('- 20 achievements across 6 categories')
  console.log('- User stats initialized for all users')
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
