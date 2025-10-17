// Quick DB query helper for local dev
// Prints ponds, last 10 bookings (with seat assignments), and occupied seats for pondId=1
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const ponds = await prisma.pond.findMany();
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { seatAssignments: true, bookedBy: true, pond: true },
    });
    const occupiedSeats = await prisma.bookingSeat.findMany({
      where: { booking: { pondId: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log(JSON.stringify({ ponds, bookings, occupiedSeats }, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
