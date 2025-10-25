# Game Types Enhancement - Complete ✅

## Overview
Enhanced Games Management to properly support three distinct game types with proper configuration options:
1. **HEAVIEST_WEIGHT** - Traditional heaviest catch wins
2. **TARGET_WEIGHT** - Nearest to target with uptrend/downtrend
3. **EXACT_WEIGHT** - Must match target exactly

## Database Changes

### Schema Update
Added `targetDirection` field to Game model:

```prisma
model Game {
  id              Int       @id @default(autoincrement())
  name            String
  type            GameType  // HEAVIEST_WEIGHT, TARGET_WEIGHT, EXACT_WEIGHT
  targetWeight    Float?    // Required for TARGET_WEIGHT and EXACT_WEIGHT
  targetDirection String?   // 'uptrend' or 'downtrend' for TARGET_WEIGHT
  measurementUnit String    @default("kg")
  decimalPlaces   Int       @default(2")
  description     String?
  isActive        Boolean   @default(true)
  // ... relations
}
```

### Migration
```bash
npx prisma db push
```

## Game Type Details

### 1. HEAVIEST_WEIGHT (Traditional)
**How it works:**
- Straightforward: Heaviest catch wins
- All catches are ranked by weight (descending)
- No target weight needed

**Configuration:**
- Game Type: "Heaviest Weight"
- No additional fields required

**Example:**
- Name: "Big Fish Competition"
- Type: HEAVIEST_WEIGHT
- Result: 8.5kg > 7.2kg > 6.8kg > ...

---

### 2. TARGET_WEIGHT (Uptrend/Downtrend)
**How it works:**
- **Uptrend**: Only catches ≥ target weight are valid
  - Ranked by proximity to target (nearest wins)
  - Example: Target=5kg → 5.1kg beats 5.5kg beats 6.0kg
  
- **Downtrend**: Only catches ≤ target weight are valid
  - Ranked by proximity to target (nearest wins)
  - Example: Target=5kg → 4.9kg beats 4.5kg beats 4.0kg

**Configuration:**
- Game Type: "Target Weight (Uptrend/Downtrend)"
- Target Weight: Required (e.g., 5.0 kg)
- Ranking Direction: Required (uptrend or downtrend)

**Example - Uptrend:**
```
Name: "5kg Challenge (Uptrend)"
Type: TARGET_WEIGHT
Target: 5.0 kg
Direction: uptrend

Catches:
- 5.1 kg → ✅ 1st place (0.1kg above target)
- 5.5 kg → ✅ 2nd place (0.5kg above target)
- 6.0 kg → ✅ 3rd place (1.0kg above target)
- 4.9 kg → ❌ Invalid (below target)
```

**Example - Downtrend:**
```
Name: "5kg Challenge (Downtrend)"
Type: TARGET_WEIGHT
Target: 5.0 kg
Direction: downtrend

Catches:
- 4.9 kg → ✅ 1st place (0.1kg below target)
- 4.5 kg → ✅ 2nd place (0.5kg below target)
- 4.0 kg → ✅ 3rd place (1.0kg below target)
- 5.1 kg → ❌ Invalid (above target)
```

---

### 3. EXACT_WEIGHT (Precision Challenge)
**How it works:**
- Only catches that EXACTLY match the target weight are valid
- First to achieve exact weight wins
- Requires very precise weighing equipment

**Configuration:**
- Game Type: "Exact Weight"
- Target Weight: Required (e.g., 5.0 kg)
- No direction needed

**Example:**
```
Name: "Precision Master"
Type: EXACT_WEIGHT
Target: 5.00 kg

Catches:
- 5.00 kg → ✅ Winner! (exact match)
- 4.99 kg → ❌ Invalid (not exact)
- 5.01 kg → ❌ Invalid (not exact)
```

---

## UI Improvements

### Games Management Page (`/admin/games`)

#### Game Type Dropdown
```
┌─────────────────────────────────────┐
│ Game Type                           │
├─────────────────────────────────────┤
│ ○ Heaviest Weight                   │
│ ○ Target Weight (Uptrend/Downtrend) │
│ ○ Exact Weight                      │
└─────────────────────────────────────┘
```

#### Target Weight Configuration (Conditional)
Only shown when TARGET_WEIGHT or EXACT_WEIGHT is selected:

```
┌─────────────────────────────────────┐
│ Target Weight Settings              │
├─────────────────────────────────────┤
│ Target Weight (kg):  [5.0     ]     │
│                                     │
│ (If TARGET_WEIGHT)                  │
│ Ranking Direction:                  │
│   ○ Uptrend (Above target, nearest) │
│   ○ Downtrend (Below target, nearest)│
│                                     │
│ ℹ️ Uptrend: Only catches ≥ target  │
│    are ranked. Nearest to target wins.│
└─────────────────────────────────────┘
```

#### Game Card Display
```
┌─────────────────────────────────────┐
│ 5kg Challenge (Uptrend)             │
│ Target weight challenge with uptrend│
├─────────────────────────────────────┤
│ Type: Target Weight   Unit: kg      │
│                                     │
│ ┌─ Target Settings ────────────┐   │
│ │ Target:    5.0 kg             │   │
│ │ Direction: uptrend            │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Form Validation

### Required Fields by Game Type

**HEAVIEST_WEIGHT:**
- ✅ Name
- ✅ Game Type
- ✅ Description
- ✅ Measurement Unit
- ❌ Target Weight (not needed)
- ❌ Target Direction (not needed)

**TARGET_WEIGHT:**
- ✅ Name
- ✅ Game Type
- ✅ Description
- ✅ Measurement Unit
- ✅ Target Weight (required!)
- ✅ Target Direction (required!)

**EXACT_WEIGHT:**
- ✅ Name
- ✅ Game Type
- ✅ Description
- ✅ Measurement Unit
- ✅ Target Weight (required!)
- ❌ Target Direction (not needed)

---

## Testing Checklist

### Test 1: Create HEAVIEST_WEIGHT Game
1. Go to `/admin/games`
2. Click "Add Game"
3. Fill form:
   - Name: "Big Fish Competition"
   - Type: "Heaviest Weight"
   - Description: "Catch the heaviest fish"
   - Unit: kg
4. Save
5. ✅ Should NOT show target fields
6. ✅ Game card shows "Type: Heaviest Weight"

### Test 2: Create TARGET_WEIGHT Game (Uptrend)
1. Click "Add Game"
2. Fill form:
   - Name: "5kg Challenge (Uptrend)"
   - Type: "Target Weight"
   - Target Weight: 5.0
   - Direction: "Uptrend"
   - Description: "Get as close to 5kg from above"
   - Unit: kg
3. Save
4. ✅ Should show blue target settings box
5. ✅ Game card shows target and direction
6. ✅ Description explains uptrend logic

### Test 3: Create TARGET_WEIGHT Game (Downtrend)
1. Click "Add Game"
2. Fill form:
   - Name: "5kg Challenge (Downtrend)"
   - Type: "Target Weight"
   - Target Weight: 5.0
   - Direction: "Downtrend"
   - Description: "Get as close to 5kg from below"
   - Unit: kg
3. Save
4. ✅ Should show blue target settings box
5. ✅ Game card shows "Direction: downtrend"

### Test 4: Create EXACT_WEIGHT Game
1. Click "Add Game"
2. Fill form:
   - Name: "Precision Master"
   - Type: "Exact Weight"
   - Target Weight: 5.0
   - Description: "Hit exactly 5.0kg"
   - Unit: kg
3. Save
4. ✅ Should show target field but NOT direction
5. ✅ Game card shows "Type: Exact Weight"
6. ✅ Description explains exact match requirement

### Test 5: Edit Existing Game
1. Find "Target Weight Challenge" game
2. Click Edit
3. ✅ Type dropdown shows "TARGET_WEIGHT"
4. ✅ Target Weight field is populated
5. ✅ Target Direction field is populated
6. Modify values and save
7. ✅ Changes persist

### Test 6: Switch Game Types
1. Edit a HEAVIEST_WEIGHT game
2. Change type to "Target Weight"
3. ✅ Target fields appear
4. Fill target fields
5. Change back to "Heaviest Weight"
6. ✅ Target fields disappear
7. ✅ Target values are cleared

---

## API Endpoints

### GET /api/admin/games
Returns all games with new fields:
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "5kg Challenge (Uptrend)",
      "type": "TARGET_WEIGHT",
      "targetWeight": 5.0,
      "targetDirection": "uptrend",
      "measurementUnit": "kg",
      "description": "...",
      "isActive": true
    }
  ]
}
```

### POST /api/admin/games
Create game with target fields:
```json
{
  "name": "5kg Challenge",
  "type": "TARGET_WEIGHT",
  "targetWeight": 5.0,
  "targetDirection": "uptrend",
  "measurementUnit": "kg",
  "description": "Target weight challenge"
}
```

### PUT /api/admin/games
Update game including target fields:
```json
{
  "id": 1,
  "targetWeight": 6.0,
  "targetDirection": "downtrend"
}
```

---

## Future Enhancements (Not Implemented Yet)

### Zigzag Pattern (Mentioned in requirements)
```
Future: ZIGZAG target pattern
- Alternates between above and below target
- Example: Target=5kg
  - 1st place: Closest above (5.1kg)
  - 2nd place: Closest below (4.9kg)
  - 3rd place: Next closest above (5.2kg)
  - 4th place: Next closest below (4.8kg)
```

### Leaderboard Calculation Logic
Implement ranking algorithms:
- HEAVIEST_WEIGHT: Simple descending sort
- TARGET_WEIGHT (uptrend): Filter ≥ target, sort by abs(weight - target) ASC
- TARGET_WEIGHT (downtrend): Filter ≤ target, sort by abs(weight - target) ASC
- EXACT_WEIGHT: Filter === target, sort by timestamp ASC (first wins)

---

## Success! ✅

The Games Management page now:
1. ✅ Shows correct game type dropdown (TARGET_WEIGHT, EXACT_WEIGHT, HEAVIEST_WEIGHT)
2. ✅ Shows/hides target weight fields based on type
3. ✅ Shows direction dropdown for TARGET_WEIGHT
4. ✅ Displays target settings in game cards
5. ✅ Properly saves and loads all fields
6. ✅ Provides helpful descriptions for each game type

Ready to create sophisticated fishing competitions with different challenge types! 🎣
