import { login } from '@/lib/auth'

async function fetchUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const res = await fetch(`/api/notifications/unread?userId=${userId}`)
    if (!res.ok) return 0
    const data = await res.json()
    return data.count || 0
  } catch (e) {
    console.error('fetchUnreadNotificationCount error', e)
    return 0
  }
}

// Test notification badges
async function testNotificationBadges() {
  console.log('=== Testing Notification Badges ===')
  
  // Clear localStorage first
  localStorage.clear()
  
  // Test User 1 (should have 2 notifications)
  console.log('\n--- Testing User 1 ---')
  let success = await login('user1@fishing.com', '123456@$')
  console.log('Login success:', success)
  
    if (success) {
      let count = await fetchUnreadNotificationCount(1)
      console.log('User 1 notification count:', count)
      console.log('Expected: 2, Actual:', count, 'Match:', count === 2)
    }
  
  // Test Manager 1 (should have 2 notifications) 
  console.log('\n--- Testing Manager 1 ---')
  localStorage.removeItem('authState') // logout
  success = await login('manager1@fishing.com', '123456@$')
  console.log('Login success:', success)
  
  if (success) {
    let count = await fetchUnreadNotificationCount(4)
    console.log('Manager 1 notification count:', count)
    console.log('Expected: 2, Actual:', count, 'Match:', count === 2)
  }
  
  // Test Admin (should have 2 notifications)
  console.log('\n--- Testing Admin ---')
  localStorage.removeItem('authState') // logout
  success = await login('admin@fishing.com', '123456@$')
  console.log('Login success:', success)
  
  if (success) {
    let count = await fetchUnreadNotificationCount(6)
    console.log('Admin notification count:', count)
    console.log('Expected: 2, Actual:', count, 'Match:', count === 2)
  }
  
  console.log('\n=== Test Complete ===')
}

// Add this to window so we can call it from browser console
if (typeof window !== 'undefined') {
  (window as any).testNotificationBadges = testNotificationBadges
}

export { testNotificationBadges }
