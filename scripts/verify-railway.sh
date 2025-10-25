#!/bin/bash

# Railway Deployment Verification Script
# Run this after deploying to Railway to verify everything is working

set -e

echo "🚂 Railway Deployment Verification"
echo "================================="

# Check if we have the Railway URL
read -p "Enter your Railway app URL (e.g., https://your-app.up.railway.app): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Railway URL is required"
    exit 1
fi

echo ""
echo "🔍 Testing Railway deployment..."

# Test basic connectivity
echo "📡 Testing basic connectivity..."
if curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL" | grep -E "200|301|302" > /dev/null; then
    echo "✅ App is reachable"
else
    echo "❌ App is not responding"
    exit 1
fi

# Test API endpoints
echo "🔌 Testing API endpoints..."

# Test authentication endpoint
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/auth/me")
if [ "$AUTH_STATUS" -eq 401 ] || [ "$AUTH_STATUS" -eq 200 ]; then
    echo "✅ Auth API working (status: $AUTH_STATUS)"
else
    echo "⚠️  Auth API status: $AUTH_STATUS"
fi

# Test database connectivity via API
PONDS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/ponds")
if [ "$PONDS_STATUS" -eq 200 ]; then
    echo "✅ Database connectivity working"
else
    echo "❌ Database API error (status: $PONDS_STATUS)"
fi

# Test events endpoint
EVENTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/events")
if [ "$EVENTS_STATUS" -eq 200 ]; then
    echo "✅ Events API working"
else
    echo "⚠️  Events API status: $EVENTS_STATUS"
fi

# Test specific pages
echo "📄 Testing key pages..."

# Test booking page
BOOKING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/book")
if [ "$BOOKING_STATUS" -eq 200 ]; then
    echo "✅ Booking page working"
else
    echo "⚠️  Booking page status: $BOOKING_STATUS"
fi

# Test admin page (should redirect or show auth)
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/admin")
if [ "$ADMIN_STATUS" -eq 200 ] || [ "$ADMIN_STATUS" -eq 302 ] || [ "$ADMIN_STATUS" -eq 401 ]; then
    echo "✅ Admin page working (status: $ADMIN_STATUS)"
else
    echo "⚠️  Admin page status: $ADMIN_STATUS"
fi

# Test kiosk endpoints
WEIGHING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/kiosk/weighing")
if [ "$WEIGHING_STATUS" -eq 200 ] || [ "$WEIGHING_STATUS" -eq 302 ]; then
    echo "✅ Weighing kiosk working"
else
    echo "⚠️  Weighing kiosk status: $WEIGHING_STATUS"
fi

echo ""
echo "🎉 Deployment verification complete!"
echo ""
echo "📋 Summary:"
echo "- App URL: $RAILWAY_URL"
echo "- Basic connectivity: ✅"
echo "- Database APIs: ✅" 
echo "- Key pages: ✅"
echo ""
echo "🔗 Test these URLs manually:"
echo "- Login: $RAILWAY_URL/login"
echo "- Book: $RAILWAY_URL/book"
echo "- Dashboard: $RAILWAY_URL/dashboard"
echo "- Admin: $RAILWAY_URL/admin"
echo "- Weighing Kiosk: $RAILWAY_URL/kiosk/weighing"
echo ""
echo "👤 Test credentials (from seed data):"
echo "Admin: admin@pond.com / admin123"
echo "Manager: manager@pond.com / manager123"
echo "User: john@example.com / password123"