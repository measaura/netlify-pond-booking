// Enhanced database functions using Prisma ORM
// Replaces localStorage with PostgreSQL database operations

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Type definitions using string literals instead of importing enums
type UserRoleType = 'USER' | 'MANAGER' | 'ADMIN'
type BookingTypeType = 'POND' | 'EVENT'
type GameTypeType = 'BIGGEST_FISH' | 'MOST_FISH' | 'WEIGHT_BASED'
type PondShapeType = 'RECTANGLE' | 'SQUARE' | 'CIRCLE' | 'OVAL'
type PrizeTypeType = 'TROPHY' | 'CASH' | 'VOUCHER' | 'MEDAL' | 'CERTIFICATE'

// ============================================================================
// USER FUNCTIONS
// ============================================================================

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bookingsLeader: true,
      assignedSeats: true,
      notifications: true,
    }
  })
}

export async function getUserById(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      bookingsLeader: {
        include: {
          pond: true,
          event: true,
          seatAssignments: true,
        }
      },
      assignedSeats: {
        include: {
          booking: true,
          fishingRod: true,
        }
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
      },
      catchRecords: {
        include: {
          event: true,
          game: true,
        }
      }
    }
  })
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  })
}

export async function createUser(userData: {
  email: string
  name?: string
  phone?: string
  role?: UserRoleType
}) {
  return await prisma.user.create({
    data: {
      ...userData,
      role: userData.role || 'USER',
    }
  })
}

export async function updateUser(id: number, userData: {
  name?: string
  email?: string
  phone?: string
  role?: UserRoleType
  avatar?: string
}) {
  return await prisma.user.update({
    where: { id },
    data: userData,
  })
}

// ============================================================================
// POND FUNCTIONS
// ============================================================================

export async function getPonds() {
  return await prisma.pond.findMany({
    orderBy: { id: 'asc' },
    include: {
      bookings: {
        where: {
          date: {
            gte: new Date(),
          }
        }
      },
      eventPonds: {
        include: {
          event: true,
        }
      }
    }
  })
}

export async function getPondById(id: number) {
  return await prisma.pond.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          bookedBy: true,
          seatAssignments: {
            include: {
              assignedUser: true,
            }
          }
        }
      },
      eventPonds: {
        include: {
          event: {
            include: {
              games: true,
            }
          }
        }
      }
    }
  })
}

export async function createPond(pondData: {
  name: string
  description?: string
  maxCapacity: number
  shape: PondShapeType
  seatingArrangement?: any
  price: number
}) {
  return await prisma.pond.create({
    data: pondData as any
  })
}

export async function updatePond(id: number, pondData: {
  name?: string
  description?: string
  maxCapacity?: number
  shape?: PondShapeType
  length?: number
  width?: number
  depth?: number
  price?: number
  isActive?: boolean
}) {
  return await prisma.pond.update({
    where: { id },
    data: pondData as any,
  })
}

export async function deletePond(id: number) {
  return await prisma.pond.delete({ where: { id } })
}

// ============================================================================
// BOOKING FUNCTIONS
// ============================================================================

export async function getBookings(filters?: {
  date?: Date
  pondId?: number
  eventId?: number
  userId?: number
  type?: BookingTypeType
}) {
  const where: any = {}
  
  if (filters?.date) {
    where.date = {
      gte: new Date(filters.date.toDateString()),
      lt: new Date(new Date(filters.date).setDate(filters.date.getDate() + 1))
    }
  }
  if (filters?.pondId) where.pondId = filters.pondId
  if (filters?.eventId) where.eventId = filters.eventId
  if (filters?.type) where.type = filters.type

  return await prisma.booking.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      bookedBy: true,
      pond: true,
      event: true,
      timeSlot: true,
      seatAssignments: {
        include: {
          assignedUser: true,
          fishingRod: true,
        }
      }
    }
  })
}

export async function getBookingById(id: number) {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      bookedBy: true,
      pond: true,
      event: {
        include: {
          games: {
            include: {
              prizes: true,
            }
          }
        }
      },
      timeSlot: true,
      seatAssignments: {
        include: {
          assignedUser: true,
          fishingRod: true,
          checkInRecords: true,
          weighingRecords: true,
        }
      },
      checkIns: true,
      catchRecords: true,
    }
  })
}

export async function createBooking(bookingData: {
  bookingId: string
  type: BookingTypeType
  bookedByUserId: number
  pondId?: number
  eventId?: number
  date: Date
  timeSlotId?: number
  seatsBooked: number
  totalPrice: number
  seatAssignments?: Array<{
    seatNumber: number
    assignedUserId?: number
    assignedName?: string
    assignedEmail?: string
  }>
}) {
  const { seatAssignments, ...bookingDetails } = bookingData

  // Run an atomic transaction: re-check availability then create booking + seats
  const createdBooking = await prisma.$transaction(async (tx) => {
    // Helper to compute requested seats
    const requestedSeats = bookingDetails.seatsBooked ?? (seatAssignments ? seatAssignments.length : 0)

    // If this is a pond or event booking, find the pond and ensure capacity
    let targetPondId: number | undefined = bookingDetails.pondId

    if (bookingDetails.pondId) {
      // nothing to change
    } else if (bookingDetails.eventId) {
      // If event provided but no pond, pick first eventPond
      const ev = await tx.event.findUnique({ where: { id: bookingDetails.eventId }, include: { eventPonds: true } })
      if (!ev) throw new Error('Event not found')
      if (ev.eventPonds && ev.eventPonds.length > 0) {
        targetPondId = ev.eventPonds[0].pondId
      }
    }

    if (targetPondId) {
      // Acquire row lock on pond to prevent concurrent transactions from seeing stale counts
      const pondsLocked: any = await tx.$queryRaw`
        SELECT id, "maxCapacity" FROM "Pond" WHERE id = ${targetPondId} FOR UPDATE
      `
      const pond = pondsLocked && pondsLocked[0]
      if (!pond) throw new Error('Pond not found')

      // Count already assigned seats for the same pond/date/(timeSlot if provided)
      const bookingWhereAny: any = { pondId: targetPondId, date: bookingDetails.date }
      if (bookingDetails.timeSlotId) bookingWhereAny.timeSlotId = bookingDetails.timeSlotId

      const existingSeats = await tx.bookingSeat.count({
        where: {
          booking: bookingWhereAny
        }
      })

      if (existingSeats + requestedSeats > pond.maxCapacity) {
        throw new Error('Not enough available seats')
      }
    }

    // Create booking
    const booking = await tx.booking.create({
      data: bookingDetails as any,
    })

    // Create seat assignments if provided (one-by-one inside transaction to generate qrCodes)
    if (seatAssignments && seatAssignments.length > 0) {
      for (const seat of seatAssignments) {
        await tx.bookingSeat.create({
          data: {
            bookingId: booking.id,
            seatNumber: seat.seatNumber,
            assignedUserId: seat.assignedUserId ?? undefined,
            assignedName: seat.assignedName ?? undefined,
            assignedEmail: seat.assignedEmail ?? undefined,
            qrCode: `${bookingData.bookingId}_SEAT_${seat.seatNumber}_${Date.now()}`,
          }
        })
      }
    }

    return booking
  })

  return await getBookingById(createdBooking.id)
}

export async function updateBooking(id: number, bookingData: {
  status?: string
  totalPrice?: number
  seatsBooked?: number
}) {
  return await prisma.booking.update({
    where: { id },
    data: bookingData,
  })
}

export async function cancelBooking(id: number) {
  return await updateBooking(id, { status: 'cancelled' })
}

// ============================================================================
// BOOKING SEAT FUNCTIONS
// ============================================================================

export async function getBookingSeatByQr(qrCode: string) {
  return await prisma.bookingSeat.findUnique({
    where: { qrCode },
    include: {
      booking: {
        include: {
          bookedBy: true,
          pond: true,
          event: true,
        }
      },
      assignedUser: true,
      fishingRod: true,
      checkInRecords: true,
    }
  })
}

export async function checkInSeat(qrCode: string, scannedBy?: string) {
  const seat = await getBookingSeatByQr(qrCode)
  if (!seat) throw new Error('Invalid QR code')

  // Update seat status
  await prisma.bookingSeat.update({
    where: { qrCode },
    data: {
      status: 'checked-in',
      checkedInAt: new Date(),
    }
  })

  // Create check-in record
  return await prisma.checkInRecord.create({
    data: {
      bookingId: seat.bookingId,
      bookingSeatId: seat.id,
      userId: seat.assignedUserId!,
      checkInAt: new Date(),
      scannedBy,
    }
  })
}

// Mark a check-in as checked-out by its check-in record id
export async function checkOutByCheckInId(checkInId: number, scannedBy?: string) {
  const record = await prisma.checkInRecord.findUnique({ where: { id: checkInId }, include: { bookingSeat: true } })
  if (!record) throw new Error('Check-in record not found')
  if (record.status === 'checked-out') throw new Error('Already checked out')

  // Update check-in record
  const updated = await prisma.checkInRecord.update({
    where: { id: checkInId },
    data: {
      checkOutAt: new Date(),
      status: 'checked-out',
      scannedBy: scannedBy ?? record.scannedBy ?? null,
    }
  })

  // If the check-in referenced a booking seat, revert seat status to assigned
  if (record.bookingSeatId) {
    try {
      await prisma.bookingSeat.update({ where: { id: record.bookingSeatId }, data: { status: 'assigned', checkedInAt: null } })
    } catch (e) {
      // Non-fatal: continue even if seat update fails
      console.warn('Failed to update booking seat status during checkout', e)
    }
  }

  return updated
}

// Mark a booking as no-show. Accepts booking.bookingId (string) to match client usage.
export async function markBookingNoShow(bookingBookingId: string, markedBy?: string) {
  const booking = await prisma.booking.findUnique({ where: { bookingId: bookingBookingId } })
  if (!booking) throw new Error('Booking not found')

  // Create a no-show check-in record for the booking
  const noShow = await prisma.checkInRecord.create({
    data: {
      bookingId: booking.id,
      bookingSeatId: null,
      userId: booking.bookedByUserId,
      checkInAt: new Date(),
      checkOutAt: new Date(),
      scannedBy: markedBy ?? 'system',
      status: 'no-show'
    }
  })

  // Optionally mark any seatAssignments as no-show (if desired)
  try {
    await prisma.bookingSeat.updateMany({ where: { bookingId: booking.id }, data: { status: 'no-show' } })
  } catch (e) {
    // Non-fatal
    console.warn('Failed to update booking seats to no-show', e)
  }

  return noShow
}

export async function assignFishingRod(seatQrCode: string, rodQrCode: string) {
  const seat = await getBookingSeatByQr(seatQrCode)
  if (!seat) throw new Error('Invalid seat QR code')

  const rod = await prisma.fishingRod.findUnique({
    where: { qrCode: rodQrCode }
  })
  if (!rod) throw new Error('Invalid rod QR code')

  // Update the fishing rod to point to this seat
  await prisma.fishingRod.update({
    where: { qrCode: rodQrCode },
    data: {
      bookingSeatId: seat.id,
      assignedUserId: seat.assignedUserId ?? undefined,
      status: 'active',
    }
  })

  const updatedRod = await prisma.fishingRod.findUnique({ where: { qrCode: rodQrCode } })
  return { seat, rod: updatedRod }
}

// ============================================================================
// EVENT FUNCTIONS
// ============================================================================

export async function getEvents() {
  return await prisma.event.findMany({
    orderBy: { date: 'desc' },
    include: {
      eventPonds: {
        include: {
          pond: true,
        }
      },
      games: {
        include: {
          prizes: true,
        }
      },
      bookings: {
        include: {
          bookedBy: true,
          seatAssignments: true,
        }
      }
    }
  })
}

// ============================================================================
// GAME & PRIZE FUNCTIONS
// ============================================================================

export async function getGames() {
  return await prisma.game.findMany({
    orderBy: { id: 'asc' },
    include: { prizes: true },
  })
}

export async function getGameById(id: number) {
  return await prisma.game.findUnique({
    where: { id },
    include: { prizes: true },
  })
}

export async function createGame(gameData: {
  name: string
  type: string
  measurementUnit?: string
  targetValue?: number
  decimalPlaces?: number
  description?: string
  isActive?: boolean
  eventId?: number
}) {
  // Ensure required relation eventId exists. If not provided, attempt to use the first event.
  let eventId = gameData.eventId
  if (!eventId) {
    const evt = await prisma.event.findFirst({ orderBy: { id: 'asc' } })
    if (evt) eventId = evt.id
    else throw new Error('No event exists. Create an event first before adding games.')
  }

  // Cast to any to avoid strict TS mapping issues; runtime will validate fields
  return await prisma.game.create({ data: { ...gameData, eventId, isActive: gameData.isActive ?? true } as any })
}

export async function updateGame(id: number, gameData: Partial<any>) {
  return await prisma.game.update({
    where: { id },
    data: gameData,
  })
}

export async function deleteGame(id: number) {
  // cascade delete prizes via DB relations if set; otherwise remove prizes first
  await prisma.prize.deleteMany({ where: { gameId: id } })
  return await prisma.game.delete({ where: { id } })
}

export async function getPrizes() {
  return await prisma.prize.findMany({ orderBy: { id: 'asc' } })
}

export async function createPrize(prizeData: {
  name: string
  type: string
  value: number
  description?: string
  isActive?: boolean
  gameId?: number
}) {
  // Prize requires a game relation. If gameId not provided, attempt to attach to first game.
  let gameId = prizeData.gameId
  if (!gameId) {
    const g = await prisma.game.findFirst({ orderBy: { id: 'asc' } })
    if (g) gameId = g.id
    else throw new Error('No game exists. Create a game first before adding prizes.')
  }

  // Prize requires rankStart/rankEnd — default to 1 for single rank
  const rankStart = (prizeData as any).rankStart ?? 1
  const rankEnd = (prizeData as any).rankEnd ?? 1

  return await prisma.prize.create({ data: { ...prizeData, isActive: prizeData.isActive ?? true, gameId, rankStart, rankEnd } as any })
}

export async function updatePrize(id: number, prizeData: Partial<any>) {
  return await prisma.prize.update({ where: { id }, data: prizeData })
}

export async function deletePrize(id: number) {
  return await prisma.prize.delete({ where: { id } })
}


export async function getEventById(id: number) {
  return await prisma.event.findUnique({
    where: { id },
    include: {
      eventPonds: {
        include: {
          pond: true,
        }
      },
      games: {
        include: {
          prizes: true,
        }
      },
      bookings: {
        include: {
          bookedBy: true,
          seatAssignments: {
            include: {
              assignedUser: true,
              fishingRod: true,
            }
          }
        }
      },
      catchRecords: {
        include: {
          user: true,
          fishingRod: true,
        },
        orderBy: { weight: 'desc' },
      }
    }
  })
}

export async function createEvent(eventData: {
  name: string
  description?: string
  startDate: Date
  endDate: Date
  entryFee: number
  maxParticipants?: number
  pondIds: number[]
}) {
  const { pondIds, ...eventDetails } = eventData

  const event = await prisma.event.create({
    data: {
      ...eventDetails,
      date: eventDetails.startDate,
      startTime: eventDetails.startDate.toTimeString().split(' ')[0],
      endTime: eventDetails.endDate.toTimeString().split(' ')[0],
      maxSeatsPerBooking: 6,
      bookingOpens: new Date(),
    } as any,
  })

  // Link event to ponds
  if (pondIds.length > 0) {
    await prisma.eventPond.createMany({
      data: pondIds.map(pondId => ({
        eventId: event.id,
        pondId,
      }))
    })
  }

  return await getEventById(event.id)
}

export async function deleteEvent(id: number) {
  // Remove related eventPonds first to avoid FK constraints, then delete the event
  await prisma.eventPond.deleteMany({ where: { eventId: id } })
  return await prisma.event.delete({ where: { id } })
}

export async function updateEvent(id: number, eventData: any) {
  // Map incoming fields to schema fields and handle pond links
  const { assignedPonds, startDate, endDate, bookingOpens, ...rest } = eventData

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      date: startDate ? new Date(startDate) : undefined,
      startTime: startDate ? new Date(startDate).toTimeString().split(' ')[0] : undefined,
      endTime: endDate ? new Date(endDate).toTimeString().split(' ')[0] : undefined,
      bookingOpens: bookingOpens ? new Date(bookingOpens) : undefined,
    } as any,
  })

  // If assignedPonds provided, sync eventPonds
  if (Array.isArray(assignedPonds)) {
    await prisma.eventPond.deleteMany({ where: { eventId: id } })
    if (assignedPonds.length > 0) {
      await prisma.eventPond.createMany({ data: assignedPonds.map((pid: number) => ({ eventId: id, pondId: pid })) })
    }
  }

  return await getEventById(id)
}

// ============================================================================
// FISHING ROD FUNCTIONS
// ============================================================================

export async function getFishingRods() {
  return await prisma.fishingRod.findMany({
    orderBy: { qrCode: 'asc' },
    include: {
      bookingSeat: {
        include: {
          booking: true,
          assignedUser: true,
        }
      },
      catchRecords: true,
      weighingRecords: true,
    }
  })
}

export async function getFishingRodByQr(qrCode: string) {
  return await prisma.fishingRod.findUnique({
    where: { qrCode },
    include: {
      bookingSeat: {
        include: {
          booking: {
            include: {
              bookedBy: true,
              pond: true,
              event: true,
            }
          },
          assignedUser: true,
        }
      },
      catchRecords: {
        include: {
          user: true,
          event: true,
          game: true,
        }
      },
      weighingRecords: {
        include: {
          bookingSeat: {
            include: {
              assignedUser: true,
            }
          }
        }
      },
    }
  })
}

export async function createFishingRod(rodData: {
  qrCode: string
  status?: string
  location?: string
  notes?: string
}) {
  return await prisma.fishingRod.create({
    data: {
      ...rodData,
      status: rodData.status || 'available',
    }
  })
}

export async function updateFishingRod(qrCode: string, rodData: {
  status?: string
  location?: string
  notes?: string
  isAssigned?: boolean
  assignedSeatId?: number
}) {
  return await prisma.fishingRod.update({
    where: { qrCode },
    data: rodData,
  })
}

// ============================================================================
// ROD PRINTING FUNCTIONS (Self-Service)
// ============================================================================

export async function startRodPrintSession(userId: number, bookingSeatId: number, stationId: string, scannedQrCode: string) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10 minutes
  return await prisma.rodPrintSession.create({
    data: {
      userId,
      bookingSeatId,
      stationId,
      scannedQrCode,
      sessionStatus: 'pending',
      eventValid: true,
      expiresAt,
    } as any
  })
}

export async function completeRodPrintSession(sessionId: number, rodQrCode: string) {
  // First create the fishing rod
  await createFishingRod({
    qrCode: rodQrCode,
    status: 'available',
    location: 'self-service-station',
  })

  // Update the session (use printedAt field according to schema)
  return await prisma.rodPrintSession.update({
    where: { id: sessionId },
    data: {
      rodQrCode,
      sessionStatus: 'printed',
      printedAt: new Date(),
    } as any
  })
}

export async function getRodPrintSession(sessionId: number) {
  return await prisma.rodPrintSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      bookingSeat: {
        include: {
          booking: true,
        }
      },
      fishingRod: true,
    }
  })
}

// ============================================================================
// CATCH RECORD FUNCTIONS
// ============================================================================

export async function recordCatch(catchData: {
  bookingId: number
  userId: number
  eventId?: number
  gameId?: number
  rodQrCode?: string
  weight?: number
  length?: number
  species?: string
  photo?: string
  recordedBy: string
  notes?: string
}) {
  return await prisma.catchRecord.create({
    data: catchData,
  })
}

export async function getCatchRecords(filters?: {
  eventId?: number
  userId?: number
  gameId?: number
}) {
  const where: any = {}
  
  if (filters?.eventId) where.eventId = filters.eventId
  if (filters?.userId) where.userId = filters.userId
  if (filters?.gameId) where.gameId = filters.gameId

  return await prisma.catchRecord.findMany({
    where,
    orderBy: { weight: 'desc' },
    include: {
      user: true,
      event: true,
      game: true,
      fishingRod: true,
      booking: {
        include: {
          pond: true,
        }
      }
    }
  })
}

// ============================================================================
// WEIGHING RECORD FUNCTIONS
// ============================================================================

export async function recordWeighing(weighingData: {
  seatId?: number
  rodQrCode: string
  weight: number
  species?: string
  length?: number
  photo?: string
  weighedBy: string
  notes?: string
  userId?: number
  eventId?: number
  gameId?: number
}) {
  // Ensure required relational fields exist: userId, eventId, gameId
  if (!weighingData.userId || !weighingData.eventId || !weighingData.gameId) {
    throw new Error('weighingData must include userId, eventId and gameId')
  }

  return await prisma.weighingRecord.create({
    data: {
      userId: weighingData.userId,
      rodQrCode: weighingData.rodQrCode,
      bookingSeatId: weighingData.seatId,
      eventId: weighingData.eventId,
      gameId: weighingData.gameId,
      weight: weighingData.weight,
      length: weighingData.length,
      species: weighingData.species,
      photo: weighingData.photo,
      weighedBy: weighingData.weighedBy,
      notes: weighingData.notes,
    } as any,
  })
}

export async function getWeighingRecords(filters?: {
  seatId?: number
  rodQrCode?: string
}) {
  const where: any = {}
  
  if (filters?.seatId) where.seatId = filters.seatId
  if (filters?.rodQrCode) where.rodQrCode = filters.rodQrCode

  return await prisma.weighingRecord.findMany({
    where,
    orderBy: { weight: 'desc' },
    include: {
      bookingSeat: {
        include: {
          assignedUser: true,
          booking: {
            include: {
              pond: true,
              event: true,
            }
          }
        }
      },
      fishingRod: true,
    }
  })
}

// ============================================================================
// TIME SLOT FUNCTIONS
// ============================================================================

export async function getTimeSlots() {
  return await prisma.timeSlot.findMany({
    orderBy: { id: 'asc' }
  })
}

export async function createTimeSlot(timeSlotData: {
  name: string
  startTime: string
  endTime: string
  maxBookings?: number
}) {
  return await prisma.timeSlot.create({
    data: {
      ...timeSlotData,
    } as any
  })
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

export async function createNotification(notificationData: {
  userId: number
  type: string
  title: string
  message: string
  priority?: string
  actionUrl?: string
}) {
  return await prisma.notification.create({
    data: {
      ...notificationData,
      priority: notificationData.priority || 'medium',
    }
  })
}

export async function markNotificationAsRead(id: number) {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  return await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getAvailableCapacity(pondId: number, date: Date, timeSlotId?: number) {
  const pond = await getPondById(pondId)
  if (!pond) return 0

  const bookings = await prisma.booking.findMany({
    where: {
      pondId,
      date: {
        gte: new Date(date.toDateString()),
        lt: new Date(new Date(date).setDate(date.getDate() + 1))
      },
      ...(timeSlotId ? { timeSlotId } : {}),
      status: { not: 'cancelled' }
    }
  })

  const bookedSeats = bookings.reduce((total: number, booking: any) => total + booking.seatsBooked, 0)
  // pond model uses maxCapacity
  const cap = (pond as any).maxCapacity ?? (pond as any).capacity ?? 0
  return cap - bookedSeats
}

export async function generateUniqueBookingId(type: BookingTypeType): Promise<string> {
  const prefix = type === 'EVENT' ? 'EVT' : 'PND'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  
  const bookingId = `${prefix}_${timestamp}_${random}`
  
  // Check if it exists
  const existing = await prisma.booking.findUnique({
    where: { bookingId }
  })
  
  if (existing) {
    // Recursive call if collision (very unlikely)
    return generateUniqueBookingId(type)
  }
  
  return bookingId
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalBookings,
    activeEvents,
    todayBookings,
    availableRods,
    totalCatches
  ] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count({ where: { status: { not: 'cancelled' } } }),
    prisma.event.count({
      where: {
        date: { gte: new Date() }
      }
    }),
    prisma.booking.count({
      where: {
        date: {
          gte: new Date(new Date().toDateString()),
          lt: new Date(new Date().setDate(new Date().getDate() + 1))
        },
        status: { not: 'cancelled' }
      }
    }),
    prisma.fishingRod.count({
      where: { assignedUserId: null }
    }),
    prisma.catchRecord.count()
  ])

  return {
    totalUsers,
    totalBookings,
    activeEvents,
    todayBookings,
    availableRods,
    totalCatches
  }
}

// ============================================================================
// LEADERBOARD GENERATION (server-side)
// ============================================================================

export async function generateEventLeaderboard(eventId: number) {
  // Get all catches for the event
  const catches = await getCatchRecords({ eventId })

  // Load event to get meta (games)
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { games: true } })
  if (!event) throw new Error('Event not found')

  const userStats: Record<number, any> = {}
  catches.forEach(c => {
    const uid = c.userId
    if (!userStats[uid]) userStats[uid] = { userId: uid, userName: c.user?.name ?? 'Unknown', userEmail: c.user?.email ?? '', totalWeight: 0, totalFish: 0, biggestFish: 0 }
    userStats[uid].totalWeight += c.weight || 0
    userStats[uid].totalFish += 1
    userStats[uid].biggestFish = Math.max(userStats[uid].biggestFish, c.weight || 0)
  })

  const entries = Object.values(userStats).map((s: any) => ({
    userId: s.userId,
    userName: s.userName,
    userEmail: s.userEmail,
    totalWeight: s.totalWeight,
    totalFish: s.totalFish,
    biggestFish: s.biggestFish,
    averageWeight: s.totalFish > 0 ? s.totalWeight / s.totalFish : 0,
    competitionsParticipated: 1,
    competitionsWon: 0,
    rank: 0,
    points: Math.round((s.totalWeight || 0) * 100)
  }))

  entries.sort((a: any, b: any) => {
    if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
    if (b.biggestFish !== a.biggestFish) return b.biggestFish - a.biggestFish
    return b.totalFish - a.totalFish
  })

  entries.forEach((e: any, i: number) => { e.rank = i + 1; if (e.rank === 1) e.competitionsWon = 1 })

  return {
    eventId,
    eventName: event.name,
    gameId: event.games && event.games[0] ? event.games[0].id : null,
    entries,
    lastUpdated: new Date().toISOString()
  }
}

export async function generateOverallLeaderboard() {
  const catches = await getCatchRecords()

  const userStats: Record<number, any> = {}
  catches.forEach(c => {
    const uid = c.userId
    if (!userStats[uid]) userStats[uid] = { userId: uid, userName: c.user?.name ?? 'Unknown', userEmail: c.user?.email ?? '', totalWeight: 0, totalFish: 0, biggestFish: 0, eventIds: new Set<number>(), firstPlaces: 0, lastGameId: c.gameId || null, lastCatchTimestamp: c.createdAt ? (c.createdAt as Date).toISOString() : new Date().toISOString() }
    userStats[uid].totalWeight += c.weight || 0
    userStats[uid].totalFish += 1
    userStats[uid].biggestFish = Math.max(userStats[uid].biggestFish, c.weight || 0)
    if (c.eventId) userStats[uid].eventIds.add(c.eventId)
    if (c.gameId) userStats[uid].lastGameId = c.gameId
    if (c.createdAt) userStats[uid].lastCatchTimestamp = (c.createdAt as Date).toISOString()
  })

  // compute first places per event
  const events = await prisma.event.findMany({ where: {} })
  for (const ev of events) {
    try {
      const board = await generateEventLeaderboard(ev.id)
      if (board.entries && board.entries.length > 0) {
        const winner = board.entries[0]
        if (userStats[winner.userId]) userStats[winner.userId].firstPlaces = (userStats[winner.userId].firstPlaces || 0) + 1
      }
    } catch (e) {
      // ignore
    }
  }

  const entries = Object.values(userStats).map((s: any) => ({
    userId: s.userId,
    userName: s.userName,
    userEmail: s.userEmail,
    gameId: s.lastGameId,
    value: s.totalWeight,
    timestamp: s.lastCatchTimestamp,
    totalWeight: s.totalWeight,
    totalFish: s.totalFish,
    biggestFish: s.biggestFish,
    averageWeight: s.totalFish > 0 ? s.totalWeight / s.totalFish : 0,
    competitionsParticipated: s.eventIds ? s.eventIds.size : 0,
    competitionsWon: s.firstPlaces || 0,
    rank: 0,
    points: Math.round((s.totalWeight || 0) * 100 + (s.firstPlaces || 0) * 500)
  }))

  entries.sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
    return b.biggestFish - a.biggestFish
  })
  entries.forEach((e: any, i: number) => e.rank = i + 1)
  return entries
}

export async function getUserLeaderboardStats(userId: number) {
  const overall = await generateOverallLeaderboard()
  return overall.find((e: any) => e.userId === userId) || null
}

// Legacy compatibility functions for existing components
export const getAllPonds = getPonds
export const getAllEvents = getEvents
export const getAllTimeSlots = getTimeSlots
export const getAllBookings = () => getBookings()

// Close Prisma connection when the module is unloaded
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma