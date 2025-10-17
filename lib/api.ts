// Small client-side API helpers to call server endpoints instead of using localStorage
export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const res = await fetch('/api/notifications/unread')
    if (!res.ok) return 0
    const data = await res.json()
    return data.count || 0
  } catch (e) {
    console.error('fetchUnreadNotificationCount error', e)
    return 0
  }
}

export async function fetchCurrentUserFromSession(): Promise<any | null> {
  try {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return null
    const data = await res.json()
    return data.user || null
  } catch (e) {
    return null
  }
}
