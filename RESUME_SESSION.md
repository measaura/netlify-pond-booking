# Resume instructions for assistant

**Quick Resume:** Type `resume` in a new chat to continue working on alert-to-toast migration.

**Last Updated:** October 17, 2025  
**Current Branch:** feature/alert-to-toast  
**Status:** Database refactor committed to main, alert migration in progress on feature branch

---

## 📍 Current State

### ✅ Completed Work:

**Database Refactor (Committed to main):**
- Migrated entire app from localStorage to Railway PostgreSQL
- Added Prisma ORM with 16+ models
- Created 29 API route handlers
- Updated all pages to use async database API
- Committed in 8 logical commits to main branch

**Alert Migration (On feature/alert-to-toast branch):**
- Fixed import error in `app/manager/monitor/page.tsx`
- Replaced alert() with toast in 3 files:
  - `app/ticket/page.tsx` (share functionality)
  - `app/booking/[pondId]/page.tsx` (booking validation)
  - `app/admin/control/page.tsx` (system controls)
- Branch rebased on top of main (includes all database changes)

### 🔄 In Progress:
- Alert-to-toast migration: ~15% complete (3 of ~20 files)
- Remaining: scanner pages, admin pages, bookings pages

### ⏳ Not Started:
- Typecheck & lint validation
- Smoke testing with real database
- Complete remaining alert migrations
- Open PR for review

---

## 🚀 How to Resume

**One-line command for new chat:**
```
resume
```

**What happens when you type "resume":**
1. Assistant reads this RESUME_SESSION.md file
2. Reviews SESSION_RECAP.md for complete context
3. Checks current branch (should be feature/alert-to-toast)
4. Asks which task you want to continue

---

## 📋 Next Steps (Recommended Priority)

1. **Continue Alert Migration** (High Priority)
   - Next file: `app/dedicated-scanner/page.tsx`
   - Pattern: Use `useToastSafe()` with `window.alert()` fallback
   - Commit after every 3-5 files

2. **Run Validation** (After batch of changes)
   ```bash
   npm run -s lint
   npm run -s build
   ```

3. **Test Critical Flows** (When ~80% complete)
   - Start dev server: `npm run dev`
   - Test booking creation
   - Test scanner check-in/out
   - Test admin operations
   - Verify toasts appear correctly

4. **Open PR** (When ready for review)
   - Document what was changed
   - List remaining work
   - Request review

---

## 🎯 Alert Migration Pattern

```typescript
// Import at top of file
import { useToastSafe } from '@/components/ui/toast'

// In component
const toast = useToastSafe()

// Replace alerts
// Before:
alert('Error message')

// After:
toast ? toast.push({ 
  message: 'Error message', 
  variant: 'error' 
}) : window.alert('Error message')
```

**Variants:** `'success'`, `'error'`, `'info'`

---

## 📚 Additional Context

- **SESSION_RECAP.md** - Complete session documentation with all details
- **Database:** Railway PostgreSQL (requires internet connection)
- **API Endpoints:** All 29 routes documented in SESSION_RECAP.md
- **Toast System:** Located in `components/ui/toast.tsx`

---

## 🔍 Quick Commands

```bash
# Check current branch
git branch --show-current

# See uncommitted changes
git status

# Run linting
npm run -s lint

# Start dev server
npm run dev

# View recent commits
git log --oneline -10
```

---

**End of resume file. Type `resume` in a new chat to continue!**

How to resume in a new chat:
- Open this repository in the workspace.
- Read `RESUME_SESSION.md` for context.
- The user will type the single word `resume` in the new chat. The next assistant should:
  1. Read this `RESUME_SESSION.md` file.
  2. Read the todo list at the top-level of the project or ask to view it; the file `TODO` is not present but this repo uses the assistant-managed todo list.
  3. Pick up with Todo #2: "Replace alert() usages" — mark it `in-progress` and continue editing files.

Notes:
- Use `useToastSafe()` from `components/ui/toast.tsx` and follow the existing pattern used in modified files: `const toast = useToastSafe(); toast ? toast.push({ message, variant }) : window.alert(message)`.
- Keep edits minimal and run file-level typechecks when possible. After a batch, run global checks.

Contact:
- The user prefers the assistant to continue automatically; if uncertain about priorities, ask the user to confirm whether to prioritize admin/scanner pages or run a repo-wide replace first.
