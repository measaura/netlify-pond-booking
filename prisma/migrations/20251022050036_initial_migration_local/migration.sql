/*
  Warnings:

  - You are about to drop the column `userId` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `bookedByUserId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "userId",
ADD COLUMN     "bookedByUserId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed';

-- AlterTable
ALTER TABLE "CatchRecord" ADD COLUMN     "rodQrCode" TEXT;

-- AlterTable
ALTER TABLE "CheckInRecord" ADD COLUMN     "bookingSeatId" INTEGER,
ADD COLUMN     "rodQrCode" TEXT;

-- CreateTable
CREATE TABLE "BookingSeat" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "assignedUserId" INTEGER,
    "assignedName" TEXT,
    "assignedEmail" TEXT,
    "qrCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishingRod" (
    "id" SERIAL NOT NULL,
    "qrCode" TEXT NOT NULL,
    "serialNumber" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "bookingSeatId" INTEGER,
    "assignedUserId" INTEGER,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "previousQrCode" TEXT,
    "printStationId" TEXT,
    "selfPrinted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FishingRod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RodPrintSession" (
    "id" SERIAL NOT NULL,
    "scannedQrCode" TEXT NOT NULL,
    "bookingSeatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "stationId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "sessionStatus" TEXT NOT NULL DEFAULT 'pending',
    "eventValid" BOOLEAN NOT NULL,
    "validationMessage" TEXT,
    "rodQrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "printedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RodPrintSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeighingRecord" (
    "id" SERIAL NOT NULL,
    "rodQrCode" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingSeatId" INTEGER,
    "eventId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "length" DOUBLE PRECISION,
    "species" TEXT,
    "weighedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weighedBy" TEXT NOT NULL,
    "scaleId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "photo" TEXT,
    "video" TEXT,
    "notes" TEXT,
    "leaderboardUpdated" BOOLEAN NOT NULL DEFAULT false,
    "rankAtTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeighingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeat_qrCode_key" ON "BookingSeat"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSeat_bookingId_seatNumber_key" ON "BookingSeat"("bookingId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FishingRod_qrCode_key" ON "FishingRod"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "FishingRod_bookingSeatId_key" ON "FishingRod"("bookingSeatId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishingRod" ADD CONSTRAINT "FishingRod_bookingSeatId_fkey" FOREIGN KEY ("bookingSeatId") REFERENCES "BookingSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishingRod" ADD CONSTRAINT "FishingRod_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RodPrintSession" ADD CONSTRAINT "RodPrintSession_bookingSeatId_fkey" FOREIGN KEY ("bookingSeatId") REFERENCES "BookingSeat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RodPrintSession" ADD CONSTRAINT "RodPrintSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RodPrintSession" ADD CONSTRAINT "RodPrintSession_rodQrCode_fkey" FOREIGN KEY ("rodQrCode") REFERENCES "FishingRod"("qrCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_rodQrCode_fkey" FOREIGN KEY ("rodQrCode") REFERENCES "FishingRod"("qrCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_bookingSeatId_fkey" FOREIGN KEY ("bookingSeatId") REFERENCES "BookingSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInRecord" ADD CONSTRAINT "CheckInRecord_bookingSeatId_fkey" FOREIGN KEY ("bookingSeatId") REFERENCES "BookingSeat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInRecord" ADD CONSTRAINT "CheckInRecord_rodQrCode_fkey" FOREIGN KEY ("rodQrCode") REFERENCES "FishingRod"("qrCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchRecord" ADD CONSTRAINT "CatchRecord_rodQrCode_fkey" FOREIGN KEY ("rodQrCode") REFERENCES "FishingRod"("qrCode") ON DELETE SET NULL ON UPDATE CASCADE;
