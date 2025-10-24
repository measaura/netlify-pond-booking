# Database Schema Redesign - Games & Prizes System

**Date:** October 24, 2025  
**Purpose:** Support reusable games and prize sets across multiple events

## Overview

The new system allows:
1. **Reusable Game Templates** - Create games once, use in multiple events
2. **Reusable Prize Sets** - Create prize collections, assign to any game
3. **Custom Game Names per Event** - Override template name for specific events
4. **Multiple Concurrent Games** - Participants compete in all games simultaneously
5. **Special Prizes** - Grand Prize (auto-calculated) and Lucky Draw (manual)

## Schema Changes

### 1. Game Model (Reusable Templates)
**Before:** Games belonged to specific events (`eventId` field)  
**After:** Games are standalone templates (NO `eventId`)

```prisma
model Game {
  id              Int         @id @default(autoincrement())
  name            String      // Template name
  type            GameType
  targetWeight    Float?
  measurementUnit String      @default("kg")
  decimalPlaces   Int         @default(2)
  description     String?
  isActive        Boolean     @default(true)
  
  eventGames      EventGame[] // Many-to-many with Events
  // ... other relations
}
```

### 2. PrizeSet Model (NEW - Reusable Prize Collections)
```prisma
model PrizeSet {
  id          Int       @id @default(autoincrement())
  name        String    // e.g., "Standard Podium", "Big Pool"
  description String?
  isActive    Boolean   @default(true)
  prizes      Prize[]
  eventGames  EventGame[]
}
```

**Example Prize Sets:**
- **"Standard Podium"**: 1st-RM5000, 2nd-RM3000, 3rd-RM2000, 4th-10th-RM1000
- **"Big Pool"**: 1st-10th-RM2000
- **"Single Winner"**: 1st-RM10000

### 3. Prize Model (Belongs to PrizeSet)
**Before:** Prizes belonged to games (`gameId`)  
**After:** Prizes belong to prize sets (`prizeSetId`)

```prisma
model Prize {
  id          Int       @id @default(autoincrement())
  name        String
  type        PrizeType // MONEY or ITEM
  value       Float
  rankStart   Int       // Starting rank
  rankEnd     Int       // Ending rank
  description String?   // Item description
  
  prizeSet    PrizeSet  @relation(fields: [prizeSetId], references: [id])
  prizeSetId  Int       // Now belongs to PrizeSet, not Game
}
```

### 4. EventGame Model (NEW - Junction Table)
Links Events → Games → Prize Sets with custom naming

```prisma
model EventGame {
  id             Int       @id @default(autoincrement())
  event          Event     @relation(fields: [eventId], references: [id])
  eventId        Int
  game           Game      @relation(fields: [gameId], references: [id])
  gameId         Int
  prizeSet       PrizeSet? @relation(fields: [prizeSetId], references: [id])
  prizeSetId     Int?
  
  customGameName String?   // Override template name for this event
  displayOrder   Int       @default(0)
  isActive       Boolean   @default(true)
  
  @@unique([eventId, gameId])
}
```

**Example:**
- Template: "Heaviest Fish"
- Event custom name: "King of the Lake Challenge"
- Prize Set: "Standard Podium"

### 5. SpecialPrize Model (NEW - Grand Prize & Lucky Draw)
```prisma
model SpecialPrize {
  id          Int       @id @default(autoincrement())
  event       Event     @relation(fields: [eventId], references: [id])
  eventId     Int
  
  type        String    // "GRAND_PRIZE" or "LUCKY_DRAW"
  name        String
  prizeType   PrizeType // MONEY or ITEM
  value       Float
  description String?
  
  // Grand Prize (auto)
  winnerId     Int?
  autoAwarded  Boolean   @default(false)
  
  // Lucky Draw (manual)
  drawnAt      DateTime?
  drawnBy      String?
  winnerSeatId Int?
  
  isActive     Boolean   @default(true)
}
```

### 6. Event Model Update
```prisma
model Event {
  // ... existing fields
  eventGames       EventGame[]       // Was: games Game[]
  specialPrizes    SpecialPrize[]    // NEW
}
```

### 7. LeaderboardEntry Update
Added `totalPoints` for grand prize calculation:
```prisma
model LeaderboardEntry {
  // ... existing fields
  points       Int @default(0) // Points for this game
  totalPoints  Int @default(0) // Total across all games
}
```

## Data Flow

### Creating a Competition Event

1. **Games Management** (Admin)
   - Create standalone game templates
   - Example: "Heaviest Fish", "Target Weight", "Exact Match"

2. **Prize Sets Management** (Admin)
   - Create reusable prize collections
   - Example: "Standard Podium" with 4 prize tiers

3. **Event Creation** (Admin)
   - Create event: "Weekend Fishing Championship"
   - Add games from templates:
     - Game 1: "Heaviest Fish" → Use "Standard Podium" prizes → Custom name: "King of the Lake"
     - Game 2: "Target Weight" → Use "Big Pool" prizes → Keep template name
   - Add special prizes:
     - Grand Prize: RM20000 (auto-awarded to overall winner)
     - Lucky Draw: Motorbike (manual draw from seat IDs)

4. **Participant Experience**
   - Books 1 seat → Competes in ALL games simultaneously
   - Each catch can count toward multiple games
   - Can win prizes from multiple games
   - May win grand prize (highest total points)
   - May win lucky draw (random)

## Migration Strategy

1. **Backup existing data**
2. **Create new models**: PrizeSet, EventGame, SpecialPrize
3. **Migrate existing data**:
   - Convert existing Game → Game template (remove eventId)
   - Create PrizeSet for each existing game's prizes
   - Create EventGame entries linking events to games
4. **Update API endpoints**
5. **Update UI components**
6. **Test thoroughly**

## Benefits

✅ **Reusability** - Create once, use many times  
✅ **Flexibility** - Mix and match games and prize sets  
✅ **Custom Naming** - Brand games per event  
✅ **Concurrent Competition** - Multiple games per event  
✅ **Special Prizes** - Grand prize and lucky draw support  
✅ **Maintainability** - Update templates, affects all events  
✅ **Scalability** - Easy to add new game types and prize structures
