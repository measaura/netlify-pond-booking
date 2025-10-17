// Create a test booking using Prisma client directly (JS)
const { PrismaClient } = require('@prisma/client')
;(async () => {
  const prisma = new PrismaClient()
  try {
    const bookingId = `SMOKE${Date.now()}`
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        type: 'POND',
        bookedByUserId: 1,
        pondId: 1,
        date: new Date('2025-10-20T09:00:00.000Z'),
        timeSlotId: 1,
        seatsBooked: 1,
        totalPrice: 10,
      }
    })

    await prisma.bookingSeat.create({
      data: {
        bookingId: booking.id,
        seatNumber: 1,
        qrCode: `${booking.bookingId}_SEAT_1_${Date.now()}`
      }
    })

    const bookings = await prisma.booking.findMany({
      where: { pondId: 1 },
      include: { seatAssignments: true }
    })

    console.log('Created booking:', booking)
    console.log('Bookings for pondId=1 (latest 5):', bookings.slice(0,5))
  } catch (err) {
    console.error('Error in smoke script', err)
  } finally {
    await prisma.$disconnect()
  }
})()
