# 🔑 Demo Account Credentials

## Local Database Setup Complete

All demo accounts have been created with matching credentials between the login page and database.

---

## Test Accounts

All accounts use the same password: **`123456@$`**

### 🔧 Admin Account (1)

| Email | Name | Role | Access |
|-------|------|------|--------|
| admin@fishing.com | Super Admin | ADMIN | Full system control |

### 👔 Manager Accounts (3)

| Email | Name | Role | Access |
|-------|------|------|--------|
| manager1@fishing.com | Pond Manager 1 | MANAGER | Booking management, scanning, reports |
| manager2@fishing.com | Pond Manager 2 | MANAGER | Booking management, scanning, reports |
| manager3@fishing.com | Pond Manager 3 | MANAGER | Booking management, scanning, reports |

### 👤 User Accounts (3 Demo + 5 Additional)

#### Demo Users (shown on login page)
| Email | Name | Role | Access |
|-------|------|------|--------|
| user1@fishing.com | Test User 1 | USER | Book ponds, scan QR, view leaderboard |
| user2@fishing.com | Test User 2 | USER | Book ponds, scan QR, view leaderboard |
| user3@fishing.com | Test User 3 | USER | Book ponds, scan QR, view leaderboard |

#### Additional Test Users
| Email | Name | Role | Password |
|-------|------|------|----------|
| john@example.com | John Smith | USER | 123456@$ |
| jane@example.com | Jane Doe | USER | 123456@$ |
| mike@example.com | Mike Johnson | USER | 123456@$ |
| sarah@example.com | Sarah Wilson | USER | 123456@$ |
| tom@example.com | Tom Brown | USER | 123456@$ |

---

## Quick Login Testing

### Test Each Role:

1. **Admin Flow**
   ```
   Login: admin@fishing.com / 123456@$
   → Redirects to /admin/dashboard
   → Test: Create pond, manage users, view analytics
   ```

2. **Manager Flow**
   ```
   Login: manager1@fishing.com / 123456@$
   → Redirects to /manager/dashboard
   → Test: View monitor, scan QR codes, check bookings
   ```

3. **User Flow**
   ```
   Login: user1@fishing.com / 123456@$
   → Redirects to /dashboard
   → Test: Browse ponds, create booking, view ticket
   ```

---

## Database Verification

Check all accounts in database:
```bash
psql -U pond_admin -d pond_booking_local -c "SELECT id, email, name, role FROM \"User\" WHERE email LIKE '%@fishing.com' ORDER BY role, email;"
```

Check specific user:
```bash
psql -U pond_admin -d pond_booking_local -c "SELECT * FROM \"User\" WHERE email = 'admin@fishing.com';"
```

---

## Reseed Database

If you need to reset all data:

```bash
# Option 1: Full reset (drops and recreates everything)
npx prisma migrate reset --force

# Option 2: Just reseed users (keeps schema)
psql -U pond_admin -d pond_booking_local -c "TRUNCATE \"User\", \"Booking\", \"BookingSeat\", \"Prize\" CASCADE;"
npx prisma db seed
```

---

## Login Page Demo

The login page (`/login`) displays these three demo accounts with a "Use" button:

- 🔧 **admin@fishing.com** - Super Admin
- 👔 **manager1@fishing.com** - Pond Manager  
- 👤 **user1@fishing.com** - End User

All with password: `123456@$`

---

## Testing Checklist

- [x] Admin account created: admin@fishing.com
- [x] Manager accounts created: manager1-3@fishing.com
- [x] User accounts created: user1-3@fishing.com
- [x] All passwords set to: 123456@$
- [x] Credentials match login page demo
- [ ] Test admin login and access
- [ ] Test manager login and access
- [ ] Test user login and access
- [ ] Verify QR scanning with manager account
- [ ] Create booking with user account

---

## Next Steps

1. **Start dev server**: `npm run dev`
2. **Visit**: http://localhost:3000/login
3. **Click "Use" button** on any demo account
4. **Test features** for that role

---

## Password Security Note

⚠️ **For Production**: Change all passwords before deploying to production. Use environment variables for admin credentials and implement proper password hashing with bcrypt or similar.

The current password (`123456@$`) is for **local development and testing only**.

---

**All credentials are ready! Start testing! 🎣**
