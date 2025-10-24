-- Manual Migration: Restructure Games & Prizes System
-- Date: October 24, 2025
-- Purpose: Convert event-specific games to reusable templates with prize sets

-- STEP 1: Create PrizeSet table
CREATE TABLE IF NOT EXISTS "PrizeSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizeSet_pkey" PRIMARY KEY ("id")
);

-- STEP 2: Create EventGame junction table
CREATE TABLE IF NOT EXISTS "EventGame" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "prizeSetId" INTEGER,
    "customGameName" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EventGame_pkey" PRIMARY KEY ("id")
);

-- STEP 3: Create SpecialPrize table
CREATE TABLE IF NOT EXISTS "SpecialPrize" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prizeType" "PrizeType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "winnerId" INTEGER,
    "autoAwarded" BOOLEAN NOT NULL DEFAULT false,
    "drawnAt" TIMESTAMP(3),
    "drawnBy" TEXT,
    "winnerSeatId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialPrize_pkey" PRIMARY KEY ("id")
);

-- STEP 4: Create PrizeSets from existing game prizes
-- Each game's prizes become a prize set named after the game
INSERT INTO "PrizeSet" ("name", "description", "isActive", "createdAt", "updatedAt")
SELECT 
    g."name" || ' Prize Set',
    'Auto-generated prize set for ' || g."name",
    true,
    NOW(),
    NOW()
FROM "Game" g
WHERE EXISTS (SELECT 1 FROM "Prize" p WHERE p."gameId" = g."id");

-- STEP 5: Add temporary column to track migration
ALTER TABLE "Prize" ADD COLUMN IF NOT EXISTS "prizeSetId_temp" INTEGER;

-- STEP 6: Link prizes to their new prize sets
-- For each game, find its prize set and update prizes
UPDATE "Prize" p
SET "prizeSetId_temp" = ps."id"
FROM "Game" g
JOIN "PrizeSet" ps ON ps."name" = g."name" || ' Prize Set'
WHERE p."gameId" = g."id";

-- STEP 7: Create EventGame entries for existing games
-- Links each game to its event with the auto-generated prize set
INSERT INTO "EventGame" ("eventId", "gameId", "prizeSetId", "customGameName", "displayOrder", "isActive")
SELECT 
    g."eventId",
    g."id",
    ps."id",
    NULL, -- Use template name by default
    ROW_NUMBER() OVER (PARTITION BY g."eventId" ORDER BY g."id") - 1,
    g."isActive"
FROM "Game" g
JOIN "PrizeSet" ps ON ps."name" = g."name" || ' Prize Set';

-- STEP 8: Remove eventId from Game table (make games reusable templates)
ALTER TABLE "Game" DROP CONSTRAINT IF EXISTS "Game_eventId_fkey";
ALTER TABLE "Game" DROP COLUMN IF EXISTS "eventId";

-- STEP 9: Update Prize table - remove gameId, add prizeSetId
-- First, copy temp column to real column
ALTER TABLE "Prize" ADD COLUMN IF NOT EXISTS "prizeSetId" INTEGER;
UPDATE "Prize" SET "prizeSetId" = "prizeSetId_temp";
ALTER TABLE "Prize" ALTER COLUMN "prizeSetId" SET NOT NULL;

-- Drop old foreign key and column
ALTER TABLE "Prize" DROP CONSTRAINT IF EXISTS "Prize_gameId_fkey";
ALTER TABLE "Prize" DROP COLUMN IF EXISTS "gameId";
ALTER TABLE "Prize" DROP COLUMN IF EXISTS "prizeSetId_temp";

-- STEP 10: Add foreign key constraints
ALTER TABLE "EventGame" ADD CONSTRAINT "EventGame_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "EventGame" ADD CONSTRAINT "EventGame_gameId_fkey" 
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "EventGame" ADD CONSTRAINT "EventGame_prizeSetId_fkey" 
    FOREIGN KEY ("prizeSetId") REFERENCES "PrizeSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Prize" ADD CONSTRAINT "Prize_prizeSetId_fkey" 
    FOREIGN KEY ("prizeSetId") REFERENCES "PrizeSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpecialPrize" ADD CONSTRAINT "SpecialPrize_eventId_fkey" 
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- STEP 11: Add unique constraint to EventGame
CREATE UNIQUE INDEX IF NOT EXISTS "EventGame_eventId_gameId_key" ON "EventGame"("eventId", "gameId");

-- STEP 12: Add totalPoints to LeaderboardEntry
ALTER TABLE "LeaderboardEntry" ADD COLUMN IF NOT EXISTS "totalPoints" INTEGER NOT NULL DEFAULT 0;

-- Migration complete!
-- Summary:
-- - Created 3 new tables: PrizeSet, EventGame, SpecialPrize
-- - Converted existing games to reusable templates
-- - Created prize sets from existing game prizes
-- - Linked events to games through EventGame junction table
-- - Updated Prize to belong to PrizeSet instead of Game
