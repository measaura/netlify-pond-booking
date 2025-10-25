# Prize Sets Testing Checklist

## ✅ Complete End-to-End Test

### Part 1: Create Prize Sets (Already Working!)
**Page**: `/admin/prizes`

✅ You've already created and edited prize sets successfully

Example Prize Sets to have:
1. **Standard Podium**
   - 🥇 1st Place - $5,000
   - 🥈 2nd Place - $3,000
   - 🥉 3rd Place - $1,500
   
2. **Big Pool**
   - 🥇 1st - $10,000
   - 🥈 2nd - $7,000
   - 🥉 3rd - $5,000
   - 🏆 4th-10th - $1,000 each
   
3. **Single Winner**
   - 🥇 Champion - $15,000

---

### Part 2: Verify Games (Templates Only - No Prizes)
**Page**: `/admin/games`

Games should show:
- ✅ Game name
- ✅ Game type
- ✅ Measurement unit
- ✅ Target value (if applicable)
- ❌ NO prizes listed (correct!)

Example Games:
- "Heaviest Fish Challenge" (Heaviest, kg)
- "Target Weight 5kg" (Target, kg, 5.0)
- "Total Weight Competition" (Total, kg)

**Why no prizes?** Games are templates. Prizes are assigned when you add the game to an event.

---

### Part 3: Test Prize Sets in Events (Main Integration Point)
**Page**: `/admin/events`

#### 3A. Create New Event with Prize Sets

1. **Click "Add Event"** button
2. **Fill basic details**:
   - Name: "Test Championship"
   - Date: Any future date
   - Ponds: Select 1-2 ponds
   - Entry Fee: $50
   - Max Participants: 50

3. **Add Game #1**:
   - Click "Add Game"
   - Select Game Template: "Heaviest Fish Challenge"
   - Custom Name (optional): "King of the Lake"
   - **Select Prize Set**: "Standard Podium" ← THIS IS THE KEY TEST
   - You should see prize breakdown appear:
     ```
     Prize Breakdown:
     1st Place       $5,000
     2nd Place       $3,000
     3rd Place       $1,500
     ```

4. **Add Game #2** (Optional - to test multiple games):
   - Click "Add Game" again
   - Select Game: "Total Weight Competition"
   - Custom Name: "Total Catch Champion"
   - **Select Prize Set**: "Single Winner"
   - Prize breakdown shows: $15,000

5. **Save Event**

#### 3B. Verify Event Card Display

After saving, the event card should show:

**Header Section**:
- Event name
- Date, time, ponds
- Status badge
- Entry fee: $50
- **Prize Pool: $9,500** (for Standard Podium) or $24,500 (if you added both)
- Participants count

**Games Accordion** (Click to expand):
```
🏆 Games

┌─ King of the Lake (Heaviest)          [▼]
│  [Expanded view shows:]
│  🥇 1st - $5,000
│  🥈 2nd - $3,000
│  🥉 3rd - $1,500
│
└─ Total Catch Champion (Total)         [▼]
   [Expanded view shows:]
   🥇 Champion - $15,000
```

#### 3C. Edit Existing Event

1. Click **Edit** on any event
2. Scroll to "Competition Games" section
3. You should see:
   - List of current games
   - Each game shows selected Prize Set
   - Prize breakdown visible
4. You can:
   - Change the Prize Set dropdown
   - Add more games
   - Remove games
   - Reorder games (↑ ↓ buttons)

---

### Part 4: Prize Set Usage Tracking
**Page**: `/admin/prizes`

1. Go back to Prize Sets Management
2. Find the "Standard Podium" prize set
3. Click to expand it
4. Scroll to bottom
5. You should see **"Used In:"** section showing:
   ```
   Used In:
   - Test Championship - King of the Lake
   ```

This shows which events/games are using this prize set!

---

## Expected Behavior

### ✅ What SHOULD work:
1. Create prize sets in `/admin/prizes` ← Already working!
2. Edit prize sets ← Already working!
3. Add/remove prizes in sets ← Already working!
4. See prize sets in Events form dropdown
5. Select prize set when adding game to event
6. See prize breakdown preview in form
7. See prizes in event card accordion
8. See total prize pool in event stats
9. See usage tracking in prize set details

### ❌ What should NOT happen:
- Games page should NOT show prizes (they're templates)
- Prize sets should NOT be directly linked to games
- Deleting a game shouldn't delete prizes
- Deleting a prize set shouldn't delete games

---

## Quick Verification Commands

### 1. Check Prize Sets API
```bash
curl http://localhost:3000/api/admin/prize-sets
```
Should return all prize sets with prizes and eventGames relations.

### 2. Check Events API
```bash
curl http://localhost:3000/api/admin/events
```
Should return events with eventGames.prizeSet.prizes populated.

---

## Common Issues & Solutions

### Issue: Prize Set dropdown is empty
**Cause**: No prize sets created yet
**Solution**: Go to `/admin/prizes` and create at least one prize set

### Issue: Can't see prizes in event card
**Cause**: Event was created before prize sets existed
**Solution**: Edit the event and re-select the prize set

### Issue: Prize pool shows $0
**Cause**: No games added to event, or no prize sets selected
**Solution**: Add games with prize sets assigned

---

## Success Criteria ✅

You should be able to:
1. ✅ Create reusable prize sets once
2. ✅ Use the same prize set in multiple events
3. ✅ Mix different prize sets in the same event (different games)
4. ✅ Change prize sets without changing games
5. ✅ See total prize pool calculated automatically
6. ✅ View prize breakdown in event cards
7. ✅ Track which events use which prize sets

---

## Next Steps After Testing

If everything works:
1. Create your actual prize sets (Standard, Premium, Championship, etc.)
2. Create your game templates (if not already done)
3. Create/update events with proper prize sets
4. Test the public-facing event booking page
5. Test leaderboard and prize distribution features

---

## Visual Verification

### Prize Sets Page (`/admin/prizes`)
```
┌─────────────────────────────────────┐
│ 🏆 Prize Sets Management            │
├─────────────────────────────────────┤
│ [Stats Cards]                       │
│  4 Sets | 12 Prizes | $50K | 4 Active
├─────────────────────────────────────┤
│ ┌─ Standard Podium ─────────────┐  │
│ │ 3 prizes | Total: $9,500      │  │
│ │ [Expand to see prizes]        │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌─ Big Pool ────────────────────┐  │
│ │ 10 prizes | Total: $40,000    │  │
│ │ Used in 2 events              │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Events Page (`/admin/events`)
```
┌─────────────────────────────────────┐
│ Event: Summer Championship          │
├─────────────────────────────────────┤
│ Date: Aug 15, 2025 | 8:00-16:00    │
│ Prize Pool: $9,500 | Entry: $50    │
│                                     │
│ 🏆 Games                            │
│   ┌─ King of the Lake (Heaviest) ─┐│
│   │ [Click to expand]              ││
│   │   🥇 1st - $5,000              ││
│   │   🥈 2nd - $3,000              ││
│   │   🥉 3rd - $1,500              ││
│   └────────────────────────────────┘│
└─────────────────────────────────────┘
```

Everything is already implemented and should be working! 🎉
