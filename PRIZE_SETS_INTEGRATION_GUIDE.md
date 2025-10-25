# Prize Sets Integration Guide

## Architecture Overview

### The Three-Layer System

```
Games (Templates)
    ↓
EventGames (Game + Prize Set Assignment)
    ↓
Events (Actual fishing competitions)
```

## How It Works

### 1. **Games Management** (`/admin/games`)
- **Purpose**: Create reusable game templates
- **What's stored**: 
  - Game name (e.g., "Heaviest Fish", "Target Weight Challenge")
  - Game type (HEAVIEST_WEIGHT, TARGET_WEIGHT, TOTAL_WEIGHT)
  - Measurement settings
  - Description
- **What's NOT stored**: Prizes (prizes are assigned later)

### 2. **Prize Sets Management** (`/admin/prizes`)
- **Purpose**: Create reusable prize collections
- **What's stored**:
  - Prize Set name (e.g., "Standard Podium", "Big Pool")
  - Multiple prizes with ranks (1st-$5000, 2nd-$3000, etc.)
  - Prize types (MONEY or ITEM)
- **What's NOT stored**: Direct connection to games or events

### 3. **Events Management** (`/admin/events`)
- **Purpose**: Create actual fishing competitions
- **What happens here**: Games and Prize Sets are combined
- **The EventGame Junction**:
  ```typescript
  EventGame {
    event: Event          // Which event
    game: Game            // Which game template
    prizeSet: PrizeSet    // Which prize set to use
    customGameName: string // Optional custom name
    displayOrder: number   // Order in event
  }
  ```

## Complete Workflow Example

### Step 1: Create Game Templates (Games Management)
1. Go to `/admin/games`
2. Create game: "Heaviest Fish Challenge"
   - Type: HEAVIEST_WEIGHT
   - Unit: kg
   - Description: "Catch the heaviest fish"

### Step 2: Create Prize Sets (Prize Sets Management)
1. Go to `/admin/prizes`
2. Create Prize Set: "Standard Podium"
3. Add prizes to the set:
   - 🥇 1st Place: $5,000 (Rank 1-1)
   - 🥈 2nd Place: $3,000 (Rank 2-2)
   - 🥉 3rd Place: $1,500 (Rank 3-3)

### Step 3: Create Event (Events Management)
1. Go to `/admin/events`
2. Create event: "Summer Fishing Championship"
3. In the "Games & Prizes" section:
   - Click "Add Game"
   - Select game: "Heaviest Fish Challenge"
   - Select prize set: "Standard Podium"
   - Optional: Rename to "King of the Lake"
4. The event now has:
   - Game template: "Heaviest Fish Challenge"
   - Prize structure: Standard Podium prizes
   - Custom display name: "King of the Lake" (optional)

### Step 4: View Results (Events Management)
The event card shows:
```
Summer Fishing Championship
├── Game: King of the Lake (Heaviest)
│   ├── 🥇 1st - $5,000
│   ├── 🥈 2nd - $3,000
│   └── 🥉 3rd - $1,500
└── Total Prize Pool: $9,500
```

## Key Benefits

### 1. **Reusability**
- Create "Heaviest Fish" game once → Use in 10 events
- Create "Standard Podium" prize set once → Use in 10 events
- Mix and match: Same game with different prize sets

### 2. **Flexibility**
```
Event A: "Heaviest Fish" + "Standard Podium" ($9,500 total)
Event B: "Heaviest Fish" + "Big Pool" ($50,000 total)
Event C: "Heaviest Fish" + "Single Winner" ($15,000 total)
```

### 3. **Consistency**
- All "Standard Podium" events have same prize structure
- Update the prize set once → affects all future events
- Past events remain unchanged

### 4. **Custom Naming**
```
Game Template: "Heaviest Fish"
↓
Event A: "King of the Lake Challenge"
Event B: "Champion Fisher Contest"
Event C: "Heaviest Fish" (default name)
```

## Database Relationships

```prisma
// Game Templates (reusable)
Game {
  id: 1
  name: "Heaviest Fish"
  type: HEAVIEST_WEIGHT
}

// Prize Sets (reusable)
PrizeSet {
  id: 1
  name: "Standard Podium"
  prizes: [
    { rank: 1, value: 5000 },
    { rank: 2, value: 3000 },
    { rank: 3, value: 1500 }
  ]
}

// EventGame (junction - links them together)
EventGame {
  id: 1
  eventId: 10
  gameId: 1              // References Game
  prizeSetId: 1          // References PrizeSet
  customGameName: "King of the Lake"
}
```

## Where Prize Sets Are Used

### ❌ NOT in Games Management
Games are templates without prizes. This is correct!

### ✅ IN Events Management
When you:
1. Create or edit an event
2. Add a game to the event
3. Select which Prize Set to use for that game
4. The prizes appear in the event card accordion

## Checking Prize Set Integration

### Test Flow:
1. **Create Prize Set**:
   - Go to `/admin/prizes`
   - Create "Test Podium" with 3 prizes
   - Verify it appears in the list

2. **View in Events**:
   - Go to `/admin/events`
   - Create new event or edit existing
   - In "Games & Prizes" section, add a game
   - You should see a "Prize Set" dropdown
   - Select "Test Podium"
   - Save event

3. **Verify Display**:
   - Event card should show the game
   - Click to expand the game accordion
   - Should see all 3 prizes from "Test Podium"

## API Endpoints

### Prize Sets
- `GET /api/admin/prize-sets` - List all sets
- `POST /api/admin/prize-sets` - Create set
- `PUT /api/admin/prize-sets` - Update set
- `DELETE /api/admin/prize-sets` - Delete set

### Prizes
- `GET /api/admin/prizes` - List all prizes
- `POST /api/admin/prizes` - Create prize (requires prizeSetId)
- `PUT /api/admin/prizes` - Update prize
- `DELETE /api/admin/prizes` - Delete prize

### Events (includes EventGame with Prize Sets)
- `GET /api/admin/events` - Includes eventGames.prizeSet.prizes
- `POST /api/admin/events` - Create with eventGames
- `PUT /api/admin/events` - Update with eventGames

## Summary

✅ **Games Management**: Create game templates (NO prizes)
✅ **Prize Sets Management**: Create prize collections (NO games)
✅ **Events Management**: Combine games + prize sets = EventGame

This separation ensures:
- Maximum reusability
- Easy maintenance
- Consistent prize structures
- Flexible combinations
- Clear data model

The Prize Sets you create in `/admin/prizes` will be available for selection when you add games to events in `/admin/events`! 🎉
