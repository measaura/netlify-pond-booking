# 🔧 PostgreSQL Setup Troubleshooting

## Error: "role postgres does not exist"

This happens when PostgreSQL is installed without creating the default `postgres` superuser.

### Quick Fix (Run in order):

#### Step 1: Create a superuser
```bash
# Option A: Use our helper script (recommended)
./scripts/create-postgres-user.sh

# Option B: Manual creation
createuser -s $(whoami)
# or
createuser -s postgres
```

#### Step 2: Run the setup script
```bash
./scripts/setup-local-db.sh
```

---

## Common PostgreSQL Issues

### 1. PostgreSQL Not Running

**Symptoms:**
```
connection to server on socket "/tmp/.s.PGSQL.5432" failed
```

**Solutions:**

**macOS (Homebrew):**
```bash
# Start PostgreSQL
brew services start postgresql@16
# or
brew services start postgresql

# Check status
brew services list | grep postgresql

# If stuck, restart
brew services restart postgresql@16
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

---

### 2. Permission Denied

**Symptoms:**
```
createuser: error: could not connect to database
FATAL: role "username" does not exist
```

**Solution:**
```bash
# Initialize PostgreSQL data directory (macOS Homebrew)
initdb /opt/homebrew/var/postgresql@16

# Start service
brew services start postgresql@16

# Create superuser
createuser -s $(whoami)
```

---

### 3. Port Already in Use

**Symptoms:**
```
could not bind IPv4 address "127.0.0.1": Address already in use
```

**Solution:**
```bash
# Find process using port 5432
lsof -i :5432

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port in .env
DATABASE_URL="postgresql://user:pass@localhost:5433/db_name"
```

---

### 4. Database Already Exists

**Symptoms:**
Script asks to drop and recreate database

**Solution:**
```bash
# Option A: Let script handle it (type 'y' when prompted)

# Option B: Manual cleanup
psql -U $(whoami) -c "DROP DATABASE pond_booking_local;"
./scripts/setup-local-db.sh

# Option C: Keep existing and skip to migrations
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

---

### 5. Prisma Migration Errors

**Symptoms:**
```
Migration failed: relation "User" already exists
```

**Solution:**
```bash
# Reset database completely
npx prisma migrate reset

# Or force migrations
npx prisma migrate deploy --skip-generate
```

---

### 6. Connection String Issues

**Symptoms:**
```
Invalid DATABASE_URL
```

**Check your .env file:**
```bash
# Format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Example
DATABASE_URL="postgresql://pond_admin:pond_secure_2024@localhost:5432/pond_booking_local"

# Test connection
psql "$DATABASE_URL"
```

---

## Manual Setup (If Scripts Fail)

### 1. Start PostgreSQL
```bash
brew services start postgresql@16
```

### 2. Create superuser
```bash
createuser -s $(whoami)
```

### 3. Create database
```bash
createdb pond_booking_local
```

### 4. Create application user
```bash
psql -c "CREATE USER pond_admin WITH PASSWORD 'pond_secure_2024';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE pond_booking_local TO pond_admin;"
psql -d pond_booking_local -c "GRANT ALL ON SCHEMA public TO pond_admin;"
```

### 5. Update .env
```bash
echo 'DATABASE_URL="postgresql://pond_admin:pond_secure_2024@localhost:5432/pond_booking_local"' > .env
```

### 6. Run migrations
```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

---

## Verification Steps

### Test PostgreSQL connection:
```bash
# As your user
psql -l

# As postgres
psql -U postgres -l

# Test database
psql -d pond_booking_local
```

### Check PostgreSQL version:
```bash
psql --version
postgres --version
```

### View PostgreSQL logs (macOS):
```bash
tail -f /opt/homebrew/var/log/postgresql@16.log
```

### Check running processes:
```bash
ps aux | grep postgres
```

---

## Complete Clean Reinstall (Last Resort)

### macOS with Homebrew:
```bash
# Stop and uninstall
brew services stop postgresql@16
brew uninstall postgresql@16

# Remove data directory
rm -rf /opt/homebrew/var/postgresql@16

# Reinstall
brew install postgresql@16

# Initialize
initdb /opt/homebrew/var/postgresql@16

# Start
brew services start postgresql@16

# Create superuser
createuser -s $(whoami)

# Run setup script
./scripts/setup-local-db.sh
```

---

## Alternative: Use Docker PostgreSQL

If local PostgreSQL continues to have issues:

```bash
# Start PostgreSQL in Docker
docker run --name pond-postgres \
  -e POSTGRES_USER=pond_admin \
  -e POSTGRES_PASSWORD=pond_secure_2024 \
  -e POSTGRES_DB=pond_booking_local \
  -p 5432:5432 \
  -d postgres:16

# Update .env
DATABASE_URL="postgresql://pond_admin:pond_secure_2024@localhost:5432/pond_booking_local"

# Run migrations
npx prisma migrate dev
npx prisma db seed
```

---

## Getting Help

If none of these solutions work:

1. **Check PostgreSQL logs**:
   - macOS: `/opt/homebrew/var/log/postgresql@16.log`
   - Linux: `/var/log/postgresql/`

2. **Verify installation**:
   ```bash
   which psql
   which postgres
   brew info postgresql@16
   ```

3. **Check environment**:
   ```bash
   echo $PATH
   env | grep PG
   ```

4. **Create GitHub issue** with:
   - PostgreSQL version
   - Operating system
   - Error messages
   - Output of: `brew list | grep postgres`

---

## Quick Reference

| Problem | Command |
|---------|---------|
| Create superuser | `./scripts/create-postgres-user.sh` |
| Start PostgreSQL | `brew services start postgresql@16` |
| Check status | `brew services list \| grep postgres` |
| Test connection | `psql -l` |
| View databases | `psql -l` |
| Reset database | `npx prisma migrate reset` |
| Open Prisma Studio | `npx prisma studio` |

---

**Still stuck? The helper script should fix most issues:**
```bash
./scripts/create-postgres-user.sh
./scripts/setup-local-db.sh
```
